import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { cancelGroupBuyOrdersWorkflow } from "../workflows/group-buy/workflows/cancel-group-buy-orders";
import { recordGroupBuyOrderWorkflow } from "../workflows/group-buy/workflows/record-group-buy-order";

/*
  Counts placed orders toward their group buys (line items carry
  metadata.group_buy_id from /store/group-buys/:id/join) and releases the
  quantity again when such an order is cancelled.
*/
export default async function groupBuyOrdersHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const orderId = event.data.id;

  if (event.name === "order.canceled") {
    await cancelGroupBuyOrdersWorkflow(container).run({ input: { order_id: orderId } });
    return;
  }

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "items.id", "items.quantity", "items.metadata"],
    filters: { id: orderId },
  });
  if (!order) return;
  const perGroup = new Map<string, number>();
  for (const item of order.items ?? []) {
    const gid = (item?.metadata as Record<string, unknown> | null)?.group_buy_id;
    if (typeof gid === "string" && gid) perGroup.set(gid, (perGroup.get(gid) ?? 0) + Number(item!.quantity));
  }
  for (const [group_buy_id, quantity] of perGroup) {
    try {
      await recordGroupBuyOrderWorkflow(container).run({
        input: { group_buy_id, order_id: order.id, customer_id: order.customer_id ?? null, quantity },
      });
    } catch (e) {
      logger.error(`[group-buy] order ${order.id} -> ${group_buy_id}: ${(e as Error).message}`);
    }
  }
}

export const config: SubscriberConfig = { event: ["order.placed", "order.canceled"] };
