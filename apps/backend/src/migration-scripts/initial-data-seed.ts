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
  WANGJIA® paddle wheel aerators (kincir air) for shrimp and fish ponds.
  Prices are placeholders in IDR — set the real list prices in the admin.
*/
export const WANGJIA_PRODUCTS = (
  collectionId: string,
  categoryId: (name: string) => string,
  shippingProfileId: string,
  salesChannelId: string,
  idr: (amount: number) => { currency_code: string; amount: number }[]
) => [
  {
    title: "Kincir Air WANGJIA 1 HP",
    handle: "kincir-air-wangjia-1-hp",
    subtitle: "Aerator tambak 2 impeller · 1 HP",
    collection_id: collectionId,
    category_ids: [categoryId("Kincir Air (Aerator)")],
    description:
      "Kincir air (paddle wheel aerator) WANGJIA 1 HP untuk tambak udang dan ikan. Motor 1 HP hemat listrik, gearbox tahan air, impeller plastik anti pecah, pelampung HDPE. Tersedia 1 phase dan 3 phase. Garansi motor 1 tahun, suku cadang tersedia di Jakarta.\n\nWANGJIA 1HP 增氧水车，适用于虾塘、鱼塘。省电电机，防水齿轮箱，抗裂叶轮，HDPE 浮筒。单相/三相可选。电机保修 1 年，雅加达备件库。",
    weight: 65000,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    metadata: {
      brand: "WANGJIA",
      "spec:01 Daya motor": "1 HP (0,75 kW)",
      "spec:02 Jumlah impeller": "2",
      "spec:03 Listrik": "220 V 1 phase / 380 V 3 phase, 50 Hz",
      "spec:04 Putaran impeller": "±110 rpm",
      "spec:05 Luas kolam": "1.000 – 2.000 m²",
      "spec:06 Transfer oksigen (SOTR)": "±1,6 kg O₂/jam",
      "spec:07 Bahan rangka": "Baja galvanis",
      "spec:08 Pelampung": "HDPE, 2 buah",
      "spec:09 Berat": "±65 kg",
      "spec:10 Garansi": "Motor 1 tahun",
    },
    options: [{ title: "Listrik", values: ["1 Phase", "3 Phase"] }],
    variants: [
      { title: "1 Phase", sku: "WJ-KA-1HP-1P", options: { Listrik: "1 Phase" }, manage_inventory: false, prices: idr(5_250_000) },
      { title: "3 Phase", sku: "WJ-KA-1HP-3P", options: { Listrik: "3 Phase" }, manage_inventory: false, prices: idr(5_450_000) },
    ],
    sales_channels: [{ id: salesChannelId }],
  },
  {
    title: "Kincir Air WANGJIA 2 HP",
    handle: "kincir-air-wangjia-2-hp",
    subtitle: "Aerator tambak 4 impeller · 2 HP",
    collection_id: collectionId,
    category_ids: [categoryId("Kincir Air (Aerator)")],
    description:
      "Kincir air WANGJIA 2 HP dengan 4 impeller untuk tambak intensif. Oksigen terlarut lebih tinggi per kWh, rangka galvanis, cocok untuk kolam 2.000–4.000 m². Tersedia 1 phase dan 3 phase.\n\nWANGJIA 2HP 四叶轮增氧水车，适合高密度养殖，镀锌机架，2000–4000 m² 塘口。",
    weight: 95000,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    metadata: {
      brand: "WANGJIA",
      "spec:01 Daya motor": "2 HP (1,5 kW)",
      "spec:02 Jumlah impeller": "4",
      "spec:03 Listrik": "220 V 1 phase / 380 V 3 phase, 50 Hz",
      "spec:04 Putaran impeller": "±110 rpm",
      "spec:05 Luas kolam": "2.000 – 4.000 m²",
      "spec:06 Transfer oksigen (SOTR)": "±3,2 kg O₂/jam",
      "spec:07 Bahan rangka": "Baja galvanis",
      "spec:08 Pelampung": "HDPE, 3 buah",
      "spec:09 Berat": "±95 kg",
      "spec:10 Garansi": "Motor 1 tahun",
    },
    options: [{ title: "Listrik", values: ["1 Phase", "3 Phase"] }],
    variants: [
      { title: "1 Phase", sku: "WJ-KA-2HP-1P", options: { Listrik: "1 Phase" }, manage_inventory: false, prices: idr(8_900_000) },
      { title: "3 Phase", sku: "WJ-KA-2HP-3P", options: { Listrik: "3 Phase" }, manage_inventory: false, prices: idr(9_100_000) },
    ],
    sales_channels: [{ id: salesChannelId }],
  },
  {
    title: "Impeller Kincir WANGJIA",
    handle: "impeller-kincir-wangjia",
    category_ids: [categoryId("Suku Cadang")],
    description: "Impeller (kipas dayung) pengganti, plastik PP anti pecah, cocok kincir WANGJIA 1 HP & 2 HP.\n\nWANGJIA 水车叶轮，PP 抗裂。",
    weight: 3000,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    options: [{ title: "Tipe", values: ["Standar"] }],
    variants: [{ title: "Standar", sku: "WJ-IMP", options: { Tipe: "Standar" }, manage_inventory: false, prices: idr(185_000) }],
    sales_channels: [{ id: salesChannelId }],
  },
  {
    title: "Gearbox Kincir WANGJIA",
    handle: "gearbox-kincir-wangjia",
    category_ids: [categoryId("Suku Cadang")],
    description: "Gearbox (reducer) tahan air untuk kincir WANGJIA 1 HP / 2 HP.\n\nWANGJIA 水车防水减速齿轮箱。",
    weight: 12000,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    options: [{ title: "Daya", values: ["1 HP", "2 HP"] }],
    variants: [
      { title: "1 HP", sku: "WJ-GB-1HP", options: { Daya: "1 HP" }, manage_inventory: false, prices: idr(1_650_000) },
      { title: "2 HP", sku: "WJ-GB-2HP", options: { Daya: "2 HP" }, manage_inventory: false, prices: idr(2_250_000) },
    ],
    sales_channels: [{ id: salesChannelId }],
  },
  {
    title: "Pelampung HDPE Kincir WANGJIA",
    handle: "pelampung-kincir-wangjia",
    category_ids: [categoryId("Suku Cadang")],
    description: "Pelampung HDPE tebal, tidak bocor, per buah.\n\nWANGJIA 水车 HDPE 浮筒，单只。",
    weight: 6000,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    options: [{ title: "Tipe", values: ["Standar"] }],
    variants: [{ title: "Standar", sku: "WJ-FLOAT", options: { Tipe: "Standar" }, manage_inventory: false, prices: idr(425_000) }],
    sales_channels: [{ id: salesChannelId }],
  },
];
