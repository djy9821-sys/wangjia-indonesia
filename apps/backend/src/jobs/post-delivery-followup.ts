import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendCustomerMessage } from "../utils/payment-plan-notifications";

/*
  Daily: FOLLOWUP_DAYS (default 7) days after a shipment was delivered (or
  FOLLOWUP_DAYS + 7 after it was shipped when nobody marked it delivered),
  ask the customer once whether the machine runs well. Replies land in
  Chatwoot; the message also reminds them to register the warranty.
*/
export default async function postDeliveryFollowup(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const days = Number(process.env.FOLLOWUP_DAYS ?? 7);
  const now = Date.now();
  const dayMs = 86400000;

  const { data: fulfillments } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "shipped_at", "delivered_at", "canceled_at", "order.id", "order.display_id", "order.customer_id", "order.email", "order.customer.first_name", "order.customer.phone", "order.customer.metadata"],
    filters: { shipped_at: { $gte: new Date(now - (days + 21) * dayMs), $lte: new Date(now - days * dayMs) } },
    pagination: { take: 500, skip: 0 },
  });

  let sent = 0;
  for (const f of fulfillments as any[]) {
    if (f.canceled_at || !f.order?.customer_id) continue;
    if (f.order.customer?.metadata?.deleted_at) continue; // a deleted account is left alone
    const anchor = f.delivered_at ? new Date(f.delivered_at).getTime() + days * dayMs : new Date(f.shipped_at).getTime() + (days + 7) * dayMs;
    if (anchor > now || anchor < now - 3 * dayMs) continue; // due window: 3 days
    const key = `followup:${f.order.id}`;
    const name = f.order.customer?.first_name ?? "Pelanggan";
    try {
      const asked = await sendCustomerMessage(
        container,
        { customer_id: f.order.customer_id, phone: f.order.customer?.phone, email: f.order.email },
        "post-delivery-followup",
        `Halo ${name}, sudah sekitar ${days} hari sejak pesanan WANGJIA #${f.order.display_id} tiba. Apakah mesin sudah terpasang dan berjalan normal? Balas pesan ini jika ada kendala pemasangan atau suara tidak wajar, tim teknisi kami siap bantu. Jangan lupa daftarkan garansi di aplikasi (Pesanan → Daftarkan garansi).`,
        `Bagaimana kincir Anda? Pesanan #${f.order.display_id}`,
        { order_id: f.order.id },
        key
      );
      if (asked) sent++;
    } catch (e) {
      logger.error(`[followup] order ${f.order.id}: ${(e as Error).message}`);
    }
  }
  if (sent) logger.info(`[followup] sent ${sent} post-delivery check-in(s)`);
}

export const config = {
  name: "post-delivery-followup",
  schedule: process.env.FOLLOWUP_CRON ?? "0 3 * * *",
};
