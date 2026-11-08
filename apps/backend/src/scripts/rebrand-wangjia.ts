import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import { updateProductsWorkflow, updateStoresWorkflow } from "@medusajs/medusa/core-flows";
import { syncCatalog } from "./sync-catalog";

/*
  One-off for databases seeded before the WANGJIA rebrand:
    pnpm medusa exec ./src/scripts/rebrand-wangjia.ts
  Renames the store, unpublishes the old sample products and brings the
  WANGJIA catalogue in (see sync-catalog.ts). Safe to re-run.
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

  const oldCats = await productModule.listProductCategories({ name: ["Truk Tangki Air"] });
  if (oldCats.length) {
    await productModule.updateProductCategories(oldCats[0].id, { is_active: false });
    logger.info("Deactivated old category Truk Tangki Air");
  }

  await syncCatalog(container);
}
