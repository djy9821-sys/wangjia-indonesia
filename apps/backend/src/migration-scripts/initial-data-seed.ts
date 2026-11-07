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
          name: "Truk Tangki Air Indonesia",
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
        name: "Kargo / Freight (biaya dikonfirmasi terpisah)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Kargo",
          description:
            "Pengiriman truk dengan ekspedisi kargo. Biaya dan jadwal dikonfirmasi oleh tim kami.",
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
        { name: "Truk Tangki Air", is_active: true },
        { name: "Suku Cadang", is_active: true },
      ],
    },
  });
  const categoryId = (name: string) =>
    categoryResult.find((c) => c.name === name)!.id;

  const idr = (amount: number) => [{ currency_code: IDR, amount }];

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Truk Tangki Air (Water Tank Truck)",
          handle: "truk-tangki-air",
          collection_id: collection.id,
          category_ids: [categoryId("Truk Tangki Air")],
          description:
            "Truk tangki air untuk penyiraman jalan, suplai air proyek, perkebunan dan pemadam kebakaran. Tangki baja karbon anti karat, pompa sentrifugal, nozzle depan dan belakang, selang semprot manual. Garansi 1 tahun, suku cadang tersedia di Jakarta.\n\n水车（洒水车），适用于道路洒水、工程供水、种植园与消防。碳钢防腐罐体，离心泵，前冲后洒，带手持喷枪。整车保修 1 年，雅加达备件库。",
          weight: 6500000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Kapasitas",
              values: ["5.000 L", "8.000 L", "12.000 L", "16.000 L"],
            },
          ],
          variants: [
            {
              title: "5.000 L",
              sku: "WT-5000",
              options: { Kapasitas: "5.000 L" },
              manage_inventory: false,
              prices: idr(385_000_000),
            },
            {
              title: "8.000 L",
              sku: "WT-8000",
              options: { Kapasitas: "8.000 L" },
              manage_inventory: false,
              prices: idr(465_000_000),
            },
            {
              title: "12.000 L",
              sku: "WT-12000",
              options: { Kapasitas: "12.000 L" },
              manage_inventory: false,
              prices: idr(585_000_000),
            },
            {
              title: "16.000 L",
              sku: "WT-16000",
              options: { Kapasitas: "16.000 L" },
              manage_inventory: false,
              prices: idr(695_000_000),
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Pompa Air Sentrifugal 3 inci",
          handle: "pompa-air-sentrifugal-3-inci",
          category_ids: [categoryId("Suku Cadang")],
          description:
            "Pompa pengganti untuk truk tangki air, kapasitas 60 m³/jam.\n\n水车替换用离心泵，流量 60 m³/h。",
          weight: 45000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Tipe", values: ["Standar"] }],
          variants: [
            {
              title: "Standar",
              sku: "PUMP-3IN",
              options: { Tipe: "Standar" },
              manage_inventory: false,
              prices: idr(12_500_000),
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Selang Semprot 20 m + Nozzle",
          handle: "selang-semprot-20m",
          category_ids: [categoryId("Suku Cadang")],
          description:
            "Selang semprot manual 20 meter dengan nozzle kuningan.\n\n20 米手持喷洒软管，含铜喷头。",
          weight: 12000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Tipe", values: ["Standar"] }],
          variants: [
            {
              title: "Standar",
              sku: "HOSE-20M",
              options: { Tipe: "Standar" },
              manage_inventory: false,
              prices: idr(2_750_000),
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info(`Publishable API key: ${publishableApiKey.token}`);
}
