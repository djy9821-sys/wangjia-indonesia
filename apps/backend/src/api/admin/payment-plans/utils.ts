import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const orderSummaryFields = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "total",
  "created_at",
  "customer.id",
  "customer.first_name",
  "customer.last_name",
  "customer.phone",
  "company.id",
  "company.name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.phone",
  "shipping_address.metadata",
  "items.id",
  "items.title",
  "items.quantity",
  "items.detail.fulfilled_quantity",
  "items.detail.shipped_quantity",
  "fulfillments.id",
  "fulfillments.shipped_at",
  "fulfillments.delivered_at",
  "fulfillments.canceled_at",
  "fulfillments.labels.tracking_number",
];

/*
  Fetches orders by id and returns them keyed by id, so list endpoints can
  decorate payment plan rows with order info in one round trip.
*/
export async function fetchOrdersById(
  container: MedusaContainer,
  ids: string[]
): Promise<Record<string, Record<string, any>>> {
  if (!ids.length) {
    return {};
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: orderSummaryFields,
    filters: { id: ids },
  });
  return Object.fromEntries(orders.map((o) => [o.id, o]));
}

export function fulfillmentProgress(order: Record<string, any> | undefined) {
  const items: any[] = order?.items ?? [];
  const ordered = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const fulfilled = items.reduce(
    (s, i) => s + Number(i.detail?.fulfilled_quantity ?? 0),
    0
  );
  const shipped = items.reduce(
    (s, i) => s + Number(i.detail?.shipped_quantity ?? 0),
    0
  );
  return {
    ordered,
    fulfilled,
    shipped,
    fully_fulfilled: ordered > 0 && fulfilled >= ordered,
    fully_shipped: ordered > 0 && shipped >= ordered,
  };
}

/* Prefer the live plan; fall back to the most recent cancelled one. */
export function pickCurrentPlan<T extends { status?: string; created_at?: string | Date }>(plans: T[]): T | null {
  if (!plans?.length) return null;
  const active = plans.filter((p) => p.status !== "cancelled");
  const pool = active.length ? active : plans;
  return [...pool].sort(
    (a, b) => new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime()
  )[0];
}
