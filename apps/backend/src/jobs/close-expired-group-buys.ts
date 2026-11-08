import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { closeExpiredGroupBuysWorkflow } from "../workflows/group-buy/workflows/close-expired-group-buys";

/* Hourly: settle group buys whose deadline has passed (success or failed). */
export default async function closeExpiredGroupBuys(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const { result } = await closeExpiredGroupBuysWorkflow(container).run({ input: {} });
  if (result.failed.length || result.succeeded.length) {
    logger.info(`[group-buy] closed: ${result.succeeded.length} success, ${result.failed.length} failed`);
  }
}

export const config = {
  name: "close-expired-group-buys",
  schedule: process.env.GROUP_BUY_CLOSE_CRON ?? "15 * * * *",
};
