import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

// The first catalogue ended each product description with a line in Chinese for the owner.
// Customers read the description on the shop and in the app, so that line moves to
// metadata.note_zh, where the admin still shows it. Runs once; products without it are left alone.
const CHINESE = /[一-鿿]/;
const LAST_PARAGRAPH = /\n\s*\n([^\n]*)\s*$/;

export default async function productNotesZh({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "description", "metadata"],
  });

  for (const product of products) {
    const description = product.description ?? "";
    const last = LAST_PARAGRAPH.exec(description);
    if (!last || !CHINESE.test(last[1])) {
      continue;
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: {
          description: description.slice(0, last.index).trimEnd(),
          metadata: { ...(product.metadata ?? {}), note_zh: last[1].trim() },
        },
      },
    });
    logger.info(`Moved the Chinese note of "${product.title}" to metadata.note_zh`);
  }
}
