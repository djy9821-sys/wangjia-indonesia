import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { WANGJIA_PRODUCTS } from "../migration-scripts/initial-data-seed";

/*
  One-off for databases seeded before the WANGJIA rebrand:
    pnpm medusa exec ./src/scripts/rebrand-wangjia.ts
  Renames the store, unpublishes the old sample products and creates the
  WANGJIA aerator catalog. Safe to re-run (skips products that exist).
*/
export default async function rebrand({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModule = container.resolve(Modules.PRODUCT);
  const storeModule = container.resolve(Modules.STORE);

  const [store] = await storeModule.listStores({}, { take: 1 });
  if (store) {
    await updateStoresWorkflow(container).run({
      input: { selector: { id: store.id }, update: { name: "WANGJIA Indonesia (PT Adhinusa Lestari Jaya)" } },
    });
  }

  const { data: oldProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status"],
    filters: { handle: ["truk-tangki-air", "pompa-air-sentrifugal-3-inci", "selang-semprot-20m"] },
  });
  if (oldProducts.length) {
    await updateProductsWorkflow(container).run({
      input: { products: oldProducts.map((p) => ({ id: p.id, status: ProductStatus.DRAFT })) },
    });
    logger.info(`Unpublished ${oldProducts.length} old sample product(s)`);
  }

  // Hide the sample category from the old seed.
  const oldCats = await productModule.listProductCategories({ name: ["Truk Tangki Air"] });
  if (oldCats.length) {
    await productModule.updateProductCategories(oldCats[0].id, { is_active: false });
    logger.info("Deactivated old category Truk Tangki Air");
  }

  const { data: existing } = await query.graph({ entity: "product", fields: ["handle"] });
  const have = new Set(existing.map((p: any) => p.handle));

  let categories = await productModule.listProductCategories({ name: ["Kincir Air (Aerator)", "Suku Cadang"] });
  const names = new Set(categories.map((c) => c.name));
  const missing = ["Kincir Air (Aerator)", "Suku Cadang"].filter((n) => !names.has(n));
  if (missing.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missing.map((name) => ({ name, is_active: true })) },
    });
    categories = await productModule.listProductCategories({ name: ["Kincir Air (Aerator)", "Suku Cadang"] });
  }
  const categoryId = (name: string) => categories.find((c) => c.name === name)!.id;

  const { data: [collection] } = await query.graph({ entity: "product_collection", fields: ["id"], filters: { handle: "featured" } });
  const { data: [profile] } = await query.graph({ entity: "shipping_profile", fields: ["id"] });
  const { data: [channel] } = await query.graph({ entity: "sales_channel", fields: ["id"] });
  const idr = (amount: number) => [{ currency_code: "idr", amount }];

  const products = WANGJIA_PRODUCTS(collection?.id, categoryId, profile.id, channel.id, idr).filter(
    (p) => !have.has(p.handle)
  );
  if (products.length) {
    await createProductsWorkflow(container).run({ input: { products } });
  }
  logger.info(`WANGJIA catalog ready (${products.length} created, ${WANGJIA_PRODUCTS.length} total defined)`);
}
