import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";

// The machine category got its handle from its name, "kincir-air-(aerator)": WhatsApp ends a
// link at the bracket, so a shared link opened a missing page. Runs once.
const RENAMES: Record<string, string> = { "kincir-air-(aerator)": "kincir-air" };

export default async function categoryHandles({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: Object.keys(RENAMES) },
  });

  for (const category of categories) {
    const handle = RENAMES[category.handle];
    await updateProductCategoriesWorkflow(container).run({
      input: { selector: { id: category.id }, update: { handle } },
    });
    logger.info(`Category handle "${category.handle}" is now "${handle}"`);
  }
}
