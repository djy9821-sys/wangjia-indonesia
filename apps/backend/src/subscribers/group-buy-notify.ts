import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GROUP_BUY_MODULE } from "../modules/group-buy";
import GroupBuyModuleService from "../modules/group-buy/service";
import { sendCustomerMessage } from "../utils/payment-plan-notifications";
import { GroupBuyEvents } from "../workflows/group-buy/events";

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

/* Tells every participant when their patungan succeeds or fails. */
export default async function groupBuyNotifyHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const gb = await service.retrieveGroupBuy(event.data.id).catch(() => null);
  if (!gb) return;
  const rows = await service.listGroupBuyOrders({ group_buy_id: gb.id, status: "joined" } as any, { take: 1000 });
  const customerIds = [...new Set(rows.map((r) => r.customer_id).filter((c): c is string => !!c))];
  if (!customerIds.length) return;
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "phone", "first_name"],
    filters: { id: customerIds },
  });
  const success = event.name === GroupBuyEvents.SUCCESS;
  for (const c of customers) {
    const order = rows.find((r) => r.customer_id === c.id);
    const name = c.first_name ?? "Pelanggan";
    const text = success
      ? `Halo ${name}, patungan "${gb.title}" berhasil! Unit minimum sudah terpenuhi, harga patungan ${rupiah(Number(gb.group_price))}/unit berlaku untuk pesanan Anda. Tim kami akan memproses pengiriman setelah pembayaran diterima.`
      : `Halo ${name}, sayang sekali patungan "${gb.title}" tidak mencapai unit minimum sebelum ${new Date(gb.ends_at).toLocaleDateString("id-ID")}. Tim kami akan menghubungi Anda: pembayaran dikembalikan, atau pesanan dilanjutkan dengan harga normal.`;
    try {
      await sendCustomerMessage(
        container,
        { customer_id: c.id, phone: c.phone, email: c.email },
        success ? "group-buy-success" : "group-buy-failed",
        text,
        success ? `Patungan berhasil - ${gb.title}` : `Patungan tidak terpenuhi - ${gb.title}`,
        { group_buy_id: gb.id, order_id: order?.order_id ?? null }
      );
    } catch (e) {
      logger.error(`[group-buy] notify ${c.id}: ${(e as Error).message}`);
    }
  }
}

export const config: SubscriberConfig = { event: Object.values(GroupBuyEvents) };
