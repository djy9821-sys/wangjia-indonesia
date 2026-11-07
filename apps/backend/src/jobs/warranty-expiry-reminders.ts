import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { WARRANTY_MODULE } from "../modules/warranty";
import WarrantyModuleService from "../modules/warranty/service";
import { sendCustomerMessage } from "../utils/payment-plan-notifications";

/*
  Daily: tell owners whose warranty ends within WARRANTY_REMINDER_DAYS days
  (default 30) so they book a service check and order spare parts in time.
  One message per unit per expiry date (cache key lives 60 days; with Redis in
  production it survives restarts).
*/
export default async function warrantyExpiryReminders(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const cache = container.resolve(Modules.CACHE);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);

  const days = Number(process.env.WARRANTY_REMINDER_DAYS ?? 30);
  const now = Date.now();
  const horizon = now + days * 86400000;

  const units = await service.listWarrantyUnits(
    { status: "registered", warranty_expires_at: { $lte: new Date(horizon), $gte: new Date(now) } } as any,
    { take: 2000 }
  );

  let sent = 0;
  for (const u of units) {
    if (!u.customer_id || !u.warranty_expires_at) continue;
    const expiry = new Date(u.warranty_expires_at);
    const key = `warranty-reminder:${u.id}:${expiry.toISOString().slice(0, 10)}`;
    if (await cache.get(key)) continue;

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name", "phone", "email"],
      filters: { id: u.customer_id },
    });
    if (!customer) continue;

    const until = expiry.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const product = [u.product_title, u.variant_title].filter(Boolean).join(" ");
    try {
      await sendCustomerMessage(
        container,
        { customer_id: customer.id, phone: customer.phone, email: customer.email },
        "warranty-expiring",
        `Halo ${customer.first_name ?? "Pelanggan"}, garansi ${product} (No. seri ${u.serial}) akan berakhir pada ${until}. Sebelum habis, jadwalkan pengecekan mesin dan pastikan suku cadang (impeller, gearbox, pelampung) tersedia. Balas pesan ini atau buka aplikasi WANGJIA untuk minta servis.`,
        `Garansi ${u.serial} berakhir ${until}`,
        { warranty_unit_id: u.id }
      );
      await cache.set(key, true, 60 * 86400);
      sent++;
    } catch (e) {
      logger.error(`[warranty-reminder] ${u.serial}: ${(e as Error).message}`);
    }
  }
  if (sent) logger.info(`[warranty-reminder] sent ${sent} expiry reminder(s)`);
}

export const config = {
  name: "warranty-expiry-reminders",
  schedule: process.env.WARRANTY_REMINDER_CRON ?? "30 2 * * *",
};
