import { MedusaContainer } from "@medusajs/framework";
import { DEFAULT_REGION_STORE_POLICIES } from "../utils/region-store-policies";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/*
  Initial data for the Indonesian store. Runs once on `medusa db:migrate`.

  - Region: Indonesia, IDR, PPN 11%
  - Warehouse: Gudang Jakarta
  - Shipping: freight (quoted separately) and warehouse pickup
  - Products: water tank trucks in several capacities plus spare parts
*/
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["id"];
  const IDR = "idr";

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Aplikasi & Web Indonesia",
          description: "Mobile app and web storefront for Indonesian customers",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront & App",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "WANGJIA Indonesia (PT Adhinusa Lestari Jaya)",
          supported_currencies: [
            { currency_code: IDR, is_default: true },
            { currency_code: "usd", is_default: false },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Indonesia",
          currency_code: IDR,
          countries,
          payment_providers: ["pp_system_default"],
          metadata: DEFAULT_REGION_STORE_POLICIES,
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions (PPN 11%)...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
      default_tax_rate: {
        name: "PPN",
        code: "PPN",
        rate: 11,
      },
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Gudang Jakarta",
          address: {
            city: "Jakarta Utara",
            country_code: "ID",
            address_1: "Kawasan Industri Marunda",
            province: "DKI Jakarta",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const { result: shippingProfileResult } =
    await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "Default",
            type: "default",
          },
        ],
      },
    });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Pengiriman Indonesia",
    type: "shipping",
    service_zones: [
      {
        name: "Indonesia",
        geo_zones: [
          {
            country_code: "id",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  const shippingRules = [
    {
      attribute: "enabled_in_store",
      value: "true",
      operator: "eq" as const,
    },
    {
      attribute: "is_return",
      value: "false",
      operator: "eq" as const,
    },
  ];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Ekspedisi / Kargo (biaya dikonfirmasi terpisah)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Kargo",
          description:
            "Pengiriman kincir dengan ekspedisi kargo ke seluruh Indonesia. Biaya dan jadwal dikonfirmasi oleh tim kami.",
          code: "freight",
        },
        prices: [
          { currency_code: IDR, amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: shippingRules,
      },
      {
        name: "Ambil di Gudang Jakarta (Pickup)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Pickup",
          description: "Ambil sendiri di gudang kami di Jakarta Utara.",
          code: "pickup",
        },
        prices: [
          { currency_code: IDR, amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: shippingRules,
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product data...");
  const {
    result: [collection],
  } = await createCollectionsWorkflow(container).run({
    input: {
      collections: [
        {
          title: "Unggulan",
          handle: "featured",
        },
      ],
    },
  });

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Kincir Air (Aerator)", is_active: true },
        { name: "Suku Cadang", is_active: true },
      ],
    },
  });
  const categoryId = (name: string) =>
    categoryResult.find((c) => c.name === name)!.id;

  const idr = (amount: number) => [{ currency_code: IDR, amount }];

  await createProductsWorkflow(container).run({
    input: {
      products: WANGJIA_PRODUCTS(collection.id, categoryId, shippingProfile.id, defaultSalesChannel.id, idr),
    },
  });
  logger.info("Finished seeding product data.");

  logger.info(`Publishable API key: ${publishableApiKey.token}`);
}

/*
  WANGJIA® paddle wheel aerators (kincir air) and spare parts for shrimp and
  fish ponds. Specs, photos and the lineup come from the Indonesian
  distributor's WANGJIA catalogue (Pusat Kincir / wangjiaerator.blogspot.com).
  Prices are REFERENCE values derived from that catalogue (2019–2022 list
  prices, rounded up) — confirm the real list prices in the admin before launch.
  Photos are served from /static/products; replace them in the admin when
  better shots are available.
*/
const productImage = (name: string) =>
  `${(process.env.BACKEND_PUBLIC_URL || "http://localhost:9000").replace(/\/$/, "")}/static/products/${name}.jpg`;
const photos = (...names: string[]) => ({
  thumbnail: productImage(names[0]),
  images: names.map((n) => ({ url: productImage(n) })),
});

const KEUNGGULAN = `**Keunggulan kincir WANGJIA**
- Gearbox bevel gear (bukan worm gear) dengan mechanical seal: hemat listrik sampai 25 %, putaran stabil, mudah dibongkar untuk servis.
- Gear 9 spline dari titanium alloy & manganese; poros (AS) full solid stainless SS304, bukan besi sepuh.
- Motor dengan kumparan tembaga murni, ampere rendah, rentang tegangan lebar.
- Impeller PP tahan UV 8 daun model kaki bebek Ø 67 cm, oksigen terlarut (DO) tinggi.
- Pelampung & penutup motor HDPE tahan UV (175 × 32 × 20 cm); rangka stainless SS304.
- Suku cadang lengkap dan selalu tersedia.`;

const PERAWATAN = `**Sebelum dipakai & perawatan**
- Isi oli gearbox 700 ml (oli gigi SAE-90, mis. Pertamina Rored) lewat tutup oranye sebelum kincir dinyalakan. Ganti oli setelah 300 jam pertama, lalu setiap ±3.600 jam.
- Pasang impeller searah jarum jam (ikuti panah di gearbox); daun kipas menyerok air.
- Pastikan tegangan listrik stabil; bersihkan impeller dan pelampung dari lumpur setiap panen.`;

export const WANGJIA_PRODUCTS = (
  collectionId: string,
  categoryId: (name: string) => string,
  shippingProfileId: string,
  salesChannelId: string,
  idr: (amount: number) => { currency_code: string; amount: number }[]
) => {
  const common = (category: string) => ({
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    category_ids: [categoryId(category)],
    sales_channels: [{ id: salesChannelId }],
  });
  const aerator = common("Kincir Air (Aerator)");
  const part = common("Suku Cadang");
  const single = (sku: string, price: number) => ({
    options: [{ title: "Tipe", values: ["Standar"] }],
    variants: [{ title: "Standar", sku, options: { Tipe: "Standar" }, manage_inventory: false, prices: idr(price) }],
  });

  return [
    {
      ...aerator,
      ...photos("kincir-1hp", "kincir-1hp-toko", "kincir-1hp-oranye", "katalog-suku-cadang"),
      title: "Kincir Air WANGJIA 1 HP",
      handle: "kincir-air-wangjia-1-hp",
      subtitle: "Tipe YC-0.75A · 2 impeller · gearbox 9 spline mechanical seal",
      collection_id: collectionId,
      description: `Kincir air (paddle wheel aerator) WANGJIA 1 HP model 2 kipas untuk tambak udang dan ikan. Motor 0,75 kW 1.400 rpm hemat listrik (1,3 A pada 3 phase), gearbox bevel gear rasio 1:14 dengan mechanical seal, impeller PP tahan UV, pelampung HDPE 175 cm, rangka dan poros stainless SS304. Tersedia 1 phase (220–280 V) dan 3 phase (320–420 V), serta model gearbox 4SP (oil seal) untuk yang terbiasa dengan model lama.

${KEUNGGULAN}

**Isi paket (9 koli)**: 2 dus (motor, gearbox, 2 kopel, 2 pillow block, 1 set baut & mur), 2 pelampung, 2 impeller, 2 poros stainless, 1 penutup motor, 1 rangka stainless.

${PERAWATAN}

WANGJIA 1HP 双叶轮增氧水车：0.75 kW 电机，1:14 伞齿轮机械密封减速箱，SS304 机架与轴，HDPE 浮筒。单相/三相可选，另有 4SP 油封款。`,
      weight: 62000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Tipe": "YC-0.75A (9 spline) · YC-90-4 (4SP)",
        "spec:02 Daya motor": "1 HP (0,75 kW), 1.400 rpm, 50 Hz",
        "spec:03 Listrik": "1 phase 220–280 V (1,6 A) / 3 phase 320–420 V (1,3 A)",
        "spec:04 Impeller": "2 × PP tahan UV, 8 daun, Ø 66–67 cm",
        "spec:05 Gearbox": "Bevel gear rasio 1:14, mechanical seal, gear 9 spline titanium alloy",
        "spec:06 Pelampung": "HDPE tahan UV, 2 × 175 × 32 × 20 cm",
        "spec:07 Rangka": "Stainless steel SS304, 107 × 35 cm",
        "spec:08 Poros (AS)": "Solid stainless SS304 Ø 25 mm × 550 mm",
        "spec:09 Kopel & dudukan AS": "Kopel 6 pin; pillow block double roller, 3 posisi",
        "spec:10 Luas kolam": "±1.000–2.000 m² per unit (rekomendasi)",
        "spec:11 Oli gearbox": "700 ml SAE-90 (diisi sebelum dipakai)",
        "spec:12 Pengiriman": "9 koli, ±62 kg",
        "spec:13 Garansi": "Motor 1 tahun",
      },
      options: [{ title: "Listrik", values: ["1 Phase", "3 Phase", "3 Phase (gearbox 4SP)"] }],
      variants: [
        { title: "1 Phase", sku: "WJ-KA-1HP-1P", options: { Listrik: "1 Phase" }, manage_inventory: false, prices: idr(5_250_000) },
        { title: "3 Phase", sku: "WJ-KA-1HP-3P", options: { Listrik: "3 Phase" }, manage_inventory: false, prices: idr(5_050_000) },
        { title: "3 Phase (gearbox 4SP)", sku: "WJ-KA-1HP-3P-4SP", options: { Listrik: "3 Phase (gearbox 4SP)" }, manage_inventory: false, prices: idr(4_850_000) },
      ],
    },
    {
      ...aerator,
      ...photos("kincir-2hp", "kincir-2hp-oranye", "katalog-suku-cadang"),
      title: "Kincir Air WANGJIA 2 HP",
      handle: "kincir-air-wangjia-2-hp",
      subtitle: "Tipe YC-1.5A · 4 impeller · 3 pelampung",
      collection_id: collectionId,
      description: `Kincir air WANGJIA 2 HP model 4 kipas untuk tambak intensif. Motor 1,5 kW 1.400 rpm (3,6 A pada 3 phase), gearbox bevel gear 1:14 mechanical seal 9 spline, 4 impeller PP tahan UV, 3 pelampung HDPE 175 cm, rangka stainless SS304. Oksigen terlarut lebih tinggi per kWh dibanding dua unit 1 HP. Tersedia 1 phase (220 V) dan 3 phase (320–400 V).

${KEUNGGULAN}

**Isi paket (12 koli)**: 2 dus (motor, gearbox, 2 kopel, 2 pillow block, 1 set baut & mur), 3 pelampung, 4 impeller, 2 poros stainless, 1 penutup motor, 1 rangka stainless.

${PERAWATAN}

WANGJIA 2HP 四叶轮增氧水车：1.5 kW 电机，三浮筒，适合高密度养殖。单相/三相可选。`,
      weight: 90000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Tipe": "YC-1.5A (9 spline)",
        "spec:02 Daya motor": "2 HP (1,5 kW), 1.400 rpm, 50 Hz",
        "spec:03 Listrik": "1 phase 220 V (5,6 A) / 3 phase 320–400 V (3,6 A)",
        "spec:04 Impeller": "4 × PP tahan UV, 8 daun, Ø 66–67 cm",
        "spec:05 Gearbox": "Bevel gear rasio 1:14, mechanical seal, gear 9 spline titanium alloy",
        "spec:06 Pelampung": "HDPE tahan UV, 3 × 175 × 32 × 20 cm",
        "spec:07 Rangka": "Stainless steel SS304 (model 4 kipas)",
        "spec:08 Poros (AS)": "2 × solid stainless SS304 Ø 25 mm",
        "spec:09 Kopel & dudukan AS": "Kopel 6 pin; pillow block double roller, 3 posisi",
        "spec:10 Luas kolam": "±2.000–4.000 m² per unit (rekomendasi)",
        "spec:11 Oli gearbox": "700 ml SAE-90 (diisi sebelum dipakai)",
        "spec:12 Pengiriman": "12 koli, ±90 kg",
        "spec:13 Garansi": "Motor 1 tahun",
      },
      options: [{ title: "Listrik", values: ["1 Phase", "3 Phase"] }],
      variants: [
        { title: "1 Phase", sku: "WJ-KA-2HP-1P", options: { Listrik: "1 Phase" }, manage_inventory: false, prices: idr(6_700_000) },
        { title: "3 Phase", sku: "WJ-KA-2HP-3P", options: { Listrik: "3 Phase" }, manage_inventory: false, prices: idr(6_500_000) },
      ],
    },
    {
      ...aerator,
      ...photos("jet-aerator"),
      title: "Jet Aerator WANGJIA 2 HP",
      handle: "jet-aerator-wangjia-2-hp",
      subtitle: "3 phase · 2.800 rpm · DO > 0,75 kg O₂/jam",
      description: `Jet aerator WANGJIA 2 HP untuk menambah oksigen terlarut sekaligus membuat arus di dasar kolam. Motor 3 phase 3,6 A, 2.800 rpm, gearbox bevel gear mechanical seal dari titanium alloy & manganese. Cocok dipadukan dengan kincir air pada tambak intensif atau kolam dalam.

WANGJIA 2HP 射流增氧机：三相 3.6 A，2800 rpm，溶氧 >0.75 kg/h，适合与水车搭配用于深水池。`,
      weight: 45000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Daya motor": "2 HP (1,5 kW), 2.800 rpm",
        "spec:02 Listrik": "3 phase 320–400 V, 3,6 A",
        "spec:03 Transfer oksigen": "> 0,75 kg O₂/jam",
        "spec:04 Gearbox": "Bevel gear, mechanical seal, titanium alloy & manganese",
        "spec:05 Garansi": "Motor 1 tahun",
      },
      options: [{ title: "Listrik", values: ["3 Phase"] }],
      variants: [{ title: "3 Phase", sku: "WJ-JET-2HP-3P", options: { Listrik: "3 Phase" }, manage_inventory: false, prices: idr(6_500_000) }],
    },
    {
      ...aerator,
      ...photos("kincir-yc055"),
      title: "Kincir Air WANGJIA YC-055 Tanpa Gearbox",
      handle: "kincir-air-wangjia-yc-055",
      subtitle: "Motor anti karat & anti air 550 W · 2 impeller · direct drive",
      description: `Kincir air model 2 kipas tanpa gearbox: motor 0,55 kW anti karat dan anti air langsung memutar poros, sehingga tidak perlu isi oli dan perawatannya minimal. Cocok untuk kolam kecil, kolam bundar, atau tambak tradisional. Tersedia 1 phase (220 V) dan 3 phase (380 V), 50 Hz.

WANGJIA YC-055 直驱水车：0.55 kW 防水防锈电机，无齿轮箱免加油，适合小塘/圆池。`,
      weight: 35000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Tipe": "YC-055 (direct drive, tanpa gearbox)",
        "spec:02 Daya motor": "0,55 kW (550 W), 50 Hz",
        "spec:03 Listrik": "1 phase 200–280 V / 3 phase 380 V (1,6 A)",
        "spec:04 Impeller": "2 × PP tahan UV",
        "spec:05 Transfer oksigen": "≥ 0,9 kg O₂/jam",
        "spec:06 Garansi": "Motor 1 tahun",
      },
      options: [{ title: "Listrik", values: ["1 Phase", "3 Phase"] }],
      variants: [
        { title: "1 Phase", sku: "WJ-KA-055-1P", options: { Listrik: "1 Phase" }, manage_inventory: false, prices: idr(3_900_000) },
        { title: "3 Phase", sku: "WJ-KA-055-3P", options: { Listrik: "3 Phase" }, manage_inventory: false, prices: idr(3_800_000) },
      ],
    },

    /* ---------- Suku cadang ---------- */
    {
      ...part,
      ...photos("impeller", "impeller-kaki-bebek", "impeller-uv"),
      title: "Impeller (Kipas) Kincir WANGJIA",
      handle: "impeller-kincir-wangjia",
      subtitle: "PP tahan UV · model kaki bebek · Ø 67 cm · per pcs",
      description: `Impeller kincir air WANGJIA dari polypropylene (PP) full cor tahan sinar UV, bentuk aerodinamis model kaki bebek sehingga buih oksigen maksimal. Lubang poros Ø 25 mm (1 inci) berlapis kuningan, daun kipas bisa dilepas-pasang. Cocok untuk kincir WANGJIA 1 HP & 2 HP dan merk lain dengan poros 25 mm. Harga per 1 pcs.

WANGJIA 水车叶轮，PP 抗 UV，鸭掌型 8 叶，轴孔 25 mm 铜套，单只价。`,
      weight: 3000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Bahan": "Polypropylene (PP) tahan UV, full cor",
        "spec:02 Diameter": "66–67 cm",
        "spec:03 Lubang poros": "Ø 25 mm (1 inci), berlapis kuningan",
        "spec:04 Daun": "8 daun (standar) atau 6 daun, bisa dilepas-pasang",
        "spec:05 Kompatibel": "WANGJIA 1 HP / 2 HP dan kincir lain poros 25 mm",
      },
      options: [{ title: "Tipe", values: ["8 daun", "6 daun"] }],
      variants: [
        { title: "8 daun", sku: "WJ-IMP", options: { Tipe: "8 daun" }, manage_inventory: false, prices: idr(295_000) },
        { title: "6 daun", sku: "WJ-IMP-6", options: { Tipe: "6 daun" }, manage_inventory: false, prices: idr(275_000) },
      ],
    },
    {
      ...part,
      ...photos("gearbox-nylon", "gearbox-cast-iron", "gearbox-stainless", "motor-gearbox"),
      title: "Gearbox Kincir WANGJIA (Bevel Gear 1:14)",
      handle: "gearbox-kincir-wangjia",
      subtitle: "Mechanical seal 9 spline · nylon / cast iron / stainless · untuk 1 HP & 2 HP",
      description: `Gearbox (reducer) kincir WANGJIA tipe NR dengan bevel gear rasio 1:14 dan mechanical seal: 25 % lebih hemat listrik dibanding worm gear, ada tutup samping sehingga servis tanpa mengangkat motor, dan kebocoran oli jauh lebih kecil. Empat gear dari titanium alloy & manganese, poros keluar stainless SS304 dengan bearing roller. Pilih bahan rumah gearbox nylon (anti karat, 10 kg), cast iron (13 kg) atau stainless. Tersedia juga model lama 4 spline dengan oil seal. Satu gearbox untuk kincir 1 HP maupun 2 HP, kompatibel dengan merk lain bermodel 9 spline.

WANGJIA 水车减速箱 NR 型：1:14 伞齿轮，机械密封，尼龙/铸铁/不锈钢壳体可选，另有 4SP 油封旧款。`,
      weight: 12000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Rasio": "1:14, bevel gear",
        "spec:02 Seal": "Mechanical seal (9 spline) · oil seal (4 spline)",
        "spec:03 Gear": "4 set, titanium alloy & manganese",
        "spec:04 Dimensi": "26 × 15,5 × 23,5 cm; tinggi poros ke dasar 11–12,5 cm",
        "spec:05 Berat": "Nylon ±10 kg · cast iron ±13 kg",
        "spec:06 Oli": "700 ml – 1 L SAE-90",
        "spec:07 Kompatibel": "Kincir 1 HP & 2 HP, merk lain model 9 spline",
      },
      options: [{ title: "Tipe", values: ["Nylon · mechanical seal", "Cast iron · mechanical seal", "Stainless · mechanical seal", "Cast iron · oil seal (4SP)"] }],
      variants: [
        { title: "Nylon · mechanical seal", sku: "WJ-GB-NY-MS", options: { Tipe: "Nylon · mechanical seal" }, manage_inventory: false, prices: idr(2_100_000) },
        { title: "Cast iron · mechanical seal", sku: "WJ-GB-CI-MS", options: { Tipe: "Cast iron · mechanical seal" }, manage_inventory: false, prices: idr(2_000_000) },
        { title: "Stainless · mechanical seal", sku: "WJ-GB-SS-MS", options: { Tipe: "Stainless · mechanical seal" }, manage_inventory: false, prices: idr(2_600_000) },
        { title: "Cast iron · oil seal (4SP)", sku: "WJ-GB-CI-OS", options: { Tipe: "Cast iron · oil seal (4SP)" }, manage_inventory: false, prices: idr(1_850_000) },
      ],
    },
    {
      ...part,
      ...photos("motor-1hp", "motor-2hp", "motor-gearbox"),
      title: "Dinamo Motor Kincir WANGJIA",
      handle: "dinamo-motor-kincir-wangjia",
      subtitle: "1 HP / 2 HP · 1.400 rpm · kumparan tembaga murni",
      description: `Elektromotor pengganti untuk kincir WANGJIA dan kincir lain dengan gearbox model NR 9 spline (Dolpin, Nanrong, Taiyihsun). Kumparan 100 % tembaga murni sehingga awet, stabil dan hemat listrik. 1 HP: 0,75 kW, 1,3–1,6 A. 2 HP: 1,5 kW, 3,6 A. 1.400 rpm, 50 Hz.

WANGJIA 水车电机：1 HP / 2 HP，1400 rpm，纯铜线圈，9 花键轴。`,
      weight: 18000,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Daya": "1 HP (0,75 kW) atau 2 HP (1,5 kW)",
        "spec:02 Listrik": "1 phase 220–280 V / 3 phase 320–420 V, 50 Hz",
        "spec:03 Arus": "1 HP 1,3–1,6 A · 2 HP 3,6 A",
        "spec:04 Putaran": "1.400 rpm",
        "spec:05 Poros": "9 spline (24/36 slot)",
        "spec:06 Kumparan": "100 % tembaga murni",
      },
      options: [{ title: "Tipe", values: ["1 HP · 1 Phase", "1 HP · 3 Phase", "2 HP · 3 Phase"] }],
      variants: [
        { title: "1 HP · 1 Phase", sku: "WJ-MTR-1HP-1P", options: { Tipe: "1 HP · 1 Phase" }, manage_inventory: false, prices: idr(2_650_000) },
        { title: "1 HP · 3 Phase", sku: "WJ-MTR-1HP-3P", options: { Tipe: "1 HP · 3 Phase" }, manage_inventory: false, prices: idr(2_450_000) },
        { title: "2 HP · 3 Phase", sku: "WJ-MTR-2HP-3P", options: { Tipe: "2 HP · 3 Phase" }, manage_inventory: false, prices: idr(2_800_000) },
      ],
    },
    {
      ...part,
      ...photos("pelampung", "pelampung-uv"),
      title: "Pelampung HDPE Kincir WANGJIA",
      handle: "pelampung-kincir-wangjia",
      subtitle: "175 × 32 × 20 cm · HDPE tahan UV · per pcs",
      description: `Pelampung (floating boat) kincir WANGJIA dari HDPE tebal berkualitas tinggi, tahan sinar matahari (UV protection), tidak mudah bocor. Ukuran 175 × 32 × 20 cm, ±6,5 kg. Kincir 1 HP memakai 2 pcs, kincir 2 HP memakai 3 pcs. Harga per 1 pcs.

WANGJIA 水车 HDPE 浮筒，175 × 32 × 20 cm，抗 UV，单只价。`,
      weight: 6500,
      metadata: {
        brand: "WANGJIA",
        "spec:01 Bahan": "HDPE tebal, UV protection",
        "spec:02 Dimensi": "175 × 32 × 20 cm",
        "spec:03 Berat": "±6,5 kg",
        "spec:04 Kebutuhan": "1 HP: 2 pcs · 2 HP: 3 pcs",
      },
      ...single("WJ-FLOAT", 450_000),
    },
    {
      ...part,
      ...photos("penutup-motor"),
      title: "Penutup Motor HDPE Kincir WANGJIA",
      handle: "penutup-motor-kincir-wangjia",
      subtitle: "Motor cover HDPE tahan UV",
      description: `Penutup motor (motor cover) kincir WANGJIA dari HDPE spesial dengan UV protection, melindungi dinamo dari hujan dan cipratan air tambak. Cocok untuk kincir 1 HP dan 2 HP.

WANGJIA 水车电机罩，HDPE 抗 UV。`,
      weight: 2500,
      metadata: { brand: "WANGJIA", "spec:01 Bahan": "HDPE spesial, UV protection", "spec:02 Kompatibel": "Kincir 1 HP & 2 HP" },
      ...single("WJ-COVER", 350_000),
    },
    {
      ...part,
      ...photos("gear-set"),
      title: "Gear Set 9 Spline Gearbox WANGJIA (4 Gear)",
      handle: "gear-set-9-spline-wangjia",
      subtitle: "Bevel gear titanium alloy & manganese · untuk gearbox model NR",
      description: `Satu set 4 gear bevel pengganti untuk gearbox kincir WANGJIA model NR 9 spline (mechanical seal). Bahan titanium alloy & manganese, tahan aus. Ganti gear jika gearbox berbunyi kasar atau putaran impeller melemah.

WANGJIA 水车减速箱 9 花键伞齿轮 4 件套。`,
      weight: 4000,
      metadata: { brand: "WANGJIA", "spec:01 Isi": "4 gear bevel (1 set)", "spec:02 Bahan": "Titanium alloy & manganese", "spec:03 Untuk": "Gearbox model NR, 9 spline" },
      ...single("WJ-GEAR-9SP", 950_000),
    },
    {
      ...part,
      ...photos("pillow-block"),
      title: "Pillow Block (Dudukan AS) Kincir WANGJIA",
      handle: "pillow-block-kincir-wangjia",
      subtitle: "Double roller · 3 posisi tinggi · per pcs",
      description: `Pillow block atau pangkon AS kincir WANGJIA dengan sistem double roller (bambu roller) sehingga putaran stabil dan ampere motor rendah. Tinggi dudukan bisa diatur dalam 3 posisi. Tinggi 125 mm. Harga per 1 pcs (1 kincir memakai 2 pcs).

WANGJIA 水车轴座，双滚轮，三档可调，单只价。`,
      weight: 1200,
      metadata: { brand: "WANGJIA", "spec:01 Model": "Double roller, adjustable 3 posisi", "spec:02 Tinggi": "125 mm", "spec:03 Kebutuhan": "2 pcs per kincir" },
      ...single("WJ-PB", 90_000),
    },
    {
      ...part,
      ...photos("kopel", "kopel-posisi"),
      title: "Kopel (Moveable Joint) Kincir WANGJIA",
      handle: "kopel-kincir-wangjia",
      subtitle: "6 pin · karet kuat · cast iron atau stainless · per pcs",
      description: `Kopel / moveable joint penghubung gearbox ke poros impeller, dengan 6 titik kunci (6 pin) dan karet kuat sehingga lebih kokoh. Pilihan bahan cast iron atau stainless anti karat. Kompatibel dengan semua kincir berporos standar 25 mm. Harga per 1 pcs (1 kincir memakai 2 pcs).

WANGJIA 水车联轴器，6 销橡胶缓冲，铸铁/不锈钢可选，单只价。`,
      weight: 1500,
      metadata: { brand: "WANGJIA", "spec:01 Model": "6 pin circle coupling, karet kuat", "spec:02 Lubang poros": "Ø 25 mm", "spec:03 Kebutuhan": "2 pcs per kincir" },
      options: [{ title: "Bahan", values: ["Cast iron", "Stainless"] }],
      variants: [
        { title: "Cast iron", sku: "WJ-MJ-CI", options: { Bahan: "Cast iron" }, manage_inventory: false, prices: idr(125_000) },
        { title: "Stainless", sku: "WJ-MJ-SS", options: { Bahan: "Stainless" }, manage_inventory: false, prices: idr(185_000) },
      ],
    },
    {
      ...part,
      ...photos("katalog-suku-cadang"),
      title: "Poros (AS) Stainless Kincir WANGJIA",
      handle: "as-kincir-wangjia",
      subtitle: "Solid SS304 · Ø 25 mm × 550 mm · per pcs",
      description: `Poros (shaft / AS) kincir WANGJIA dari stainless steel SS304 full solid (padat), bukan pipa sepuh, sehingga tidak karatan dan tidak bengkok. Ukuran Ø 25 mm (1 inci) × 550 mm. Kompatibel dengan kincir merk lain model 2 kipas. Harga per 1 pcs (1 kincir memakai 2 pcs).

WANGJIA 水车 SS304 实心轴，Ø25 × 550 mm，单根价。`,
      weight: 2200,
      metadata: { brand: "WANGJIA", "spec:01 Bahan": "Stainless steel SS304 full solid", "spec:02 Ukuran": "Ø 25 mm × 550 mm", "spec:03 Kebutuhan": "2 pcs per kincir" },
      ...single("WJ-SHAFT", 325_000),
    },
    {
      ...part,
      ...photos("katalog-suku-cadang"),
      title: "Rangka (Frame) Stainless Kincir WANGJIA",
      handle: "rangka-kincir-wangjia",
      subtitle: "SS304 · 107 × 35 cm (1 HP) · tersedia model 4 kipas",
      description: `Rangka / frame kincir WANGJIA dari stainless steel SS304, penyambung pelampung sekaligus dudukan gearbox dan motor. Ukuran model 1 HP (2 kipas) 107 × 35 cm; tersedia juga model 2 HP (4 kipas). Kompatibel dengan kincir Dolpin, Nanrong, Taiyihsun dan merk lain model 1 HP.

WANGJIA 水车 SS304 机架，1 HP 款 107 × 35 cm，另有 2 HP 四叶轮款。`,
      weight: 9000,
      metadata: { brand: "WANGJIA", "spec:01 Bahan": "Stainless steel SS304", "spec:02 Ukuran": "1 HP: 107 × 35 cm · 2 HP: model 4 kipas", "spec:03 Kompatibel": "WANGJIA, Dolpin, Nanrong, Taiyihsun (1 HP)" },
      options: [{ title: "Tipe", values: ["1 HP (2 kipas)", "2 HP (4 kipas)"] }],
      variants: [
        { title: "1 HP (2 kipas)", sku: "WJ-FRAME-1HP", options: { Tipe: "1 HP (2 kipas)" }, manage_inventory: false, prices: idr(750_000) },
        { title: "2 HP (4 kipas)", sku: "WJ-FRAME-2HP", options: { Tipe: "2 HP (4 kipas)" }, manage_inventory: false, prices: idr(1_100_000) },
      ],
    },
    {
      ...part,
      ...photos("mechanical-seal"),
      title: "Mechanical Seal + Tutup Samping Gearbox 9 Spline",
      handle: "mechanical-seal-kincir-wangjia",
      subtitle: "1 set: mechanical seal + tutupan stainless",
      description: `Satu set mechanical seal dan tutup samping (stainless) untuk gearbox kincir model 9 spline — WANGJIA, Dolpin, dan merk lain yang sama modelnya. Ganti seal bila oli gearbox merembes.

WANGJIA 9 花键减速箱机械密封 + 不锈钢侧盖，1 套。`,
      weight: 600,
      metadata: { brand: "WANGJIA", "spec:01 Isi": "Mechanical seal + tutup samping stainless (1 set)", "spec:02 Untuk": "Gearbox model 9 spline (WANGJIA, Dolpin, dll.)" },
      ...single("WJ-MSEAL", 275_000),
    },
  ];
};
