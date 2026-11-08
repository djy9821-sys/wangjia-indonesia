import { ExecArgs, MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductVariantsWorkflow,
  deleteProductsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows";
import { WANGJIA_PRODUCTS } from "../migration-scripts/initial-data-seed";

/*
  Bring an existing database in line with the WANGJIA catalogue defined in
  initial-data-seed.ts (titles, descriptions, photos, spec metadata, options,
  variants). Products are matched by handle, variants by SKU.
    pnpm medusa exec ./src/scripts/sync-catalog.ts            # upsert
    pnpm medusa exec ./src/scripts/sync-catalog.ts recreate   # drop & re-create all seed products
  - Existing variant prices are left alone (prices set in the admin win).
  - A product whose options (titles or values) changed in the seed is deleted
    and re-created; orders keep their own line-item snapshots.
*/
const CATEGORIES = ["Kincir Air (Aerator)", "Suku Cadang"];

export async function syncCatalog(container: MedusaContainer, { recreate = false } = {}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModule = container.resolve(Modules.PRODUCT);

  let categories = await productModule.listProductCategories({ name: CATEGORIES });
  const missingCats = CATEGORIES.filter((n) => !categories.some((c) => c.name === n));
  if (missingCats.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingCats.map((name) => ({ name, is_active: true })) },
    });
    categories = await productModule.listProductCategories({ name: CATEGORIES });
  }
  const categoryId = (name: string) => categories.find((c) => c.name === name)!.id;

  const { data: [collection] } = await query.graph({ entity: "product_collection", fields: ["id"], filters: { handle: "featured" } });
  const { data: [profile] } = await query.graph({ entity: "shipping_profile", fields: ["id"] });
  const { data: [channel] } = await query.graph({ entity: "sales_channel", fields: ["id"] });
  const idr = (amount: number) => [{ currency_code: "idr", amount }];
  const defs = WANGJIA_PRODUCTS(collection?.id, categoryId, profile.id, channel.id, idr);

  const { data: existing } = await query.graph({
    entity: "product",
    fields: [
      "id", "handle", "metadata",
      "options.title", "options.values.value",
      "variants.id", "variants.sku",
    ],
    filters: { handle: defs.map((d) => d.handle) },
  });

  const toCreate: typeof defs = [];
  const toDelete: string[] = [];
  const productUpdates: any[] = [];
  const variantCreates: any[] = [];
  const variantUpdates: any[] = [];

  for (const def of defs) {
    const cur: any = existing.find((p: any) => p.handle === def.handle);
    if (!cur) {
      toCreate.push(def);
      continue;
    }
    // Options (titles and values) must match exactly to update in place;
    // otherwise the product is re-created so its variants stay consistent.
    const signature = (opts: { title: string; values: string[] }[]) =>
      JSON.stringify(opts.map((o) => [o.title, [...o.values].sort()]).sort());
    const sameOptions =
      signature(cur.options.map((o: any) => ({ title: o.title, values: o.values.map((v: any) => v.value) }))) ===
      signature(def.options);
    if (recreate || !sameOptions) {
      toDelete.push(cur.id);
      toCreate.push(def);
      continue;
    }
    const { options: _options, variants, sales_channels: _channels, ...scalars } = def;
    productUpdates.push({
      ...scalars,
      id: cur.id,
      // Metadata merges on update; an empty string removes a key, so stale
      // spec rows are blanked before the seed definition is applied.
      metadata: {
        ...Object.fromEntries(Object.keys(cur.metadata ?? {}).filter((k) => k.startsWith("spec:")).map((k) => [k, ""])),
        ...(def.metadata ?? {}),
      },
    });
    for (const v of variants) {
      const curV = cur.variants.find((x: any) => x.sku === v.sku);
      if (!curV) variantCreates.push({ ...v, product_id: cur.id });
      else variantUpdates.push({ id: curV.id, title: v.title, options: v.options });
    }
  }

  if (toDelete.length) {
    await deleteProductsWorkflow(container).run({ input: { ids: toDelete } });
    logger.info(`[catalog] deleted ${toDelete.length} product(s) for re-creation`);
  }
  if (toCreate.length) {
    await createProductsWorkflow(container).run({ input: { products: toCreate } });
    logger.info(`[catalog] created ${toCreate.length} product(s): ${toCreate.map((p) => p.handle).join(", ")}`);
  }
  if (productUpdates.length) {
    await updateProductsWorkflow(container).run({ input: { products: productUpdates } });
    logger.info(`[catalog] updated ${productUpdates.length} product(s)`);
  }
  if (variantUpdates.length) {
    await updateProductVariantsWorkflow(container).run({ input: { product_variants: variantUpdates } });
  }
  if (variantCreates.length) {
    await createProductVariantsWorkflow(container).run({ input: { product_variants: variantCreates } });
    logger.info(`[catalog] added ${variantCreates.length} variant(s): ${variantCreates.map((v) => v.sku).join(", ")}`);
  }
  logger.info(`[catalog] in sync: ${defs.length} product(s) defined`);
}

export default async function ({ container, args }: ExecArgs) {
  await syncCatalog(container, { recreate: args?.includes("recreate") });
}
