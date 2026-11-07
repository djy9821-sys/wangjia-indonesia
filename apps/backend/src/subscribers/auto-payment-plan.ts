import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createPaymentPlanWorkflow } from "../workflows/payment-plan/workflows/create-payment-plan";

/*
  Small orders (spare parts, accessories) should be payable right away
  instead of waiting for sales to create a payment plan by hand. When an
  order is placed (checkout) or a quote is accepted and the order total is at
  or below AUTO_PLAN_MAX_TOTAL (IDR, 0/unset = off), a single "full payment"
  plan is created automatically; the customer gets the usual WhatsApp with
  the Midtrans / transfer instructions. Bigger machine orders still get a
  deposit/balance plan from sales.
*/
export default async function autoPaymentPlanHandler({
  event,
  container,
}: SubscriberArgs<{ id?: string; order_id?: string }>) {
  const max = Number(process.env.AUTO_PLAN_MAX_TOTAL ?? 0);
  if (!max) return;
  const orderId = event.data.order_id ?? event.data.id;
  if (!orderId) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "status", "total", "is_draft_order", "payment_plan.id", "payment_plan.status"],
    filters: { id: orderId },
  });
  if (!order || order.is_draft_order || order.status === "draft" || order.status === "canceled") return;
  const total = Number(order.total ?? 0);
  if (!(total > 0) || total > max) return;
  const existing = order.payment_plan as { id: string; status: string } | null | undefined;
  if (existing && existing.status !== "cancelled") return;

  const due = new Date();
  due.setDate(due.getDate() + Number(process.env.AUTO_PLAN_DUE_DAYS ?? 3));
  try {
    await createPaymentPlanWorkflow(container).run({
      input: {
        order_id: order.id,
        release_policy: "full_paid",
        note: "Pembayaran penuh sebelum pengiriman (otomatis untuk pesanan kecil).",
        created_by: "system",
        installments: [{ label: "Pembayaran penuh", amount: total, due_date: due.toISOString() }],
      },
    });
    logger.info(`[auto-plan] order ${order.id}: full-payment plan for ${total}`);
  } catch (e) {
    logger.error(`[auto-plan] order ${order.id}: ${(e as Error).message}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order-edit.confirmed"],
};
