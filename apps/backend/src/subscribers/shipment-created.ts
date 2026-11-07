import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  loadPlanContext,
  PlanNotifications,
} from "../utils/payment-plan-notifications";

/*
  When the warehouse marks a fulfillment as shipped, tell the customer and
  include the freight tracking / vehicle number.
*/
export default async function shipmentCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (event.data.no_notification) return;
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "order.id", "labels.tracking_number"],
    filters: { id: event.data.id },
  });
  const orderId = fulfillment?.order?.id;
  if (!orderId) return;

  const {
    data: [plan],
  } = await query.graph({
    entity: "payment_plan",
    fields: ["id"],
    filters: { order_id: orderId },
  });
  if (!plan) return;

  const ctx = await loadPlanContext(container, plan.id);
  if (!ctx) return;
  const tracking = (fulfillment.labels ?? [])
    .map((l: any) => l.tracking_number)
    .filter(Boolean);
  logger.info(`[shipment] order #${ctx.order.display_id} shipped, notifying customer`);
  await PlanNotifications.shipped(container, ctx, tracking);
}

export const config: SubscriberConfig = {
  event: "shipment.created",
};
