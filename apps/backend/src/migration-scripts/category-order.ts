import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";

// Menus list categories by rank, and the machines belong before their spare parts. Databases
// that went through the rebrand got the parts category first. Runs once; a fresh database
// already has the machines at rank 0.
export default async function categoryOrder({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "rank"],
    filters: { handle: ["kincir-air", "suku-cadang"] },
  });
  const machines = categories.find((c) => c.handle === "kincir-air");
  const parts = categories.find((c) => c.handle === "suku-cadang");
  if (!machines || !parts || machines.rank < parts.rank) {
    return;
  }

  await updateProductCategoriesWorkflow(container).run({
    input: { selector: { id: machines.id }, update: { rank: parts.rank } },
  });
  logger.info("Category order: machines now come before spare parts");
}
