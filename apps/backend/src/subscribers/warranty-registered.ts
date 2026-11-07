import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { WARRANTY_MODULE } from "../modules/warranty";
import WarrantyModuleService from "../modules/warranty/service";
import { sendCustomerMessage } from "../utils/payment-plan-notifications";
import { WarrantyEvents } from "../workflows/warranty/workflows/register-warranty-unit";

/* Confirms a new warranty registration to the customer (WhatsApp / email / push). */
export default async function warrantyRegisteredHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const unit = await service.retrieveWarrantyUnit(data.id).catch(() => null);
  if (!unit?.customer_id) return;

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "phone", "first_name"],
    filters: { id: unit.customer_id },
  });

  const until = unit.warranty_expires_at
    ? new Date(unit.warranty_expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const product = [unit.product_title, unit.variant_title].filter(Boolean).join(" ");

  await sendCustomerMessage(
    container,
    { customer_id: unit.customer_id, phone: customer?.phone, email: customer?.email },
    "warranty-registered",
    `Halo ${customer?.first_name ?? "Pelanggan"}, garansi ${product} (No. seri ${unit.serial}) berhasil didaftarkan dan berlaku sampai ${until}. Simpan pesan ini sebagai bukti garansi. Butuh servis? Hubungi kami lewat aplikasi atau WhatsApp.`,
    `Garansi WANGJIA aktif - ${unit.serial}`,
    { warranty_unit_id: unit.id }
  );
}

export const config: SubscriberConfig = { event: WarrantyEvents.REGISTERED };
