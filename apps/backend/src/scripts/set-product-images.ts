import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/*
  Assign the bundled illustrations to products by SKU prefix (for databases
  seeded before images existed). Real photos uploaded in the admin win: a
  product that already has a thumbnail is left alone unless --force.
    npx medusa exec ./src/scripts/set-product-images.ts [force]
*/
const BY_SKU: [RegExp, string][] = [
  [/^WJ-KA-1HP/, "aerator-1hp"],
  [/^WJ-KA-2HP/, "aerator-2hp"],
  [/^WJ-IMP/, "impeller"],
  [/^WJ-GB/, "gearbox"],
  [/^WJ-FLOAT/, "float"],
];

export default async function ({ container, args }: ExecArgs) {
  const force = args?.includes("force");
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const products = container.resolve(Modules.PRODUCT);
  const base = (process.env.BACKEND_PUBLIC_URL || "http://localhost:9000").replace(/\/$/, "");
  const list = await products.listProducts({}, { relations: ["variants", "images"], take: 500 });
  let n = 0;
  for (const p of list) {
    const sku = p.variants?.[0]?.sku ?? "";
    const hit = BY_SKU.find(([re]) => re.test(sku));
    if (!hit) continue;
    if (p.thumbnail && !force) continue;
    const url = `${base}/static/products/${hit[1]}.png`;
    await products.updateProducts(p.id, { thumbnail: url, images: [{ url }] });
    logger.info(`[images] ${p.title} -> ${url}`);
    n++;
  }
  logger.info(`[images] updated ${n} product(s)`);
}
