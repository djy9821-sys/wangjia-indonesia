import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { roleFromMetadata } from "./admin-roles";

/*
  Builds and sends the five customer/staff notifications of the payment flow.
  Customer messages are Indonesian (WhatsApp first, email as fallback);
  staff messages are Chinese emails to finance / warehouse users.
*/

const idr = (n: number | string) =>
  "Rp " + Math.round(Number(n)).toLocaleString("id-ID");

export type PlanContext = {
  order: {
    id: string;
    display_id: number | string;
    email?: string | null;
    customer?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null;
    shipping_address?: { phone?: string | null } | null;
    currency_code?: string;
  };
  plan: {
    id: string;
    installments?: { id: string; sequence: number; label: string; amount: number | string; status: string }[];
  };
};

export async function loadPlanContext(
  container: MedusaContainer,
  planId: string
): Promise<PlanContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [plan],
  } = await query.graph({
    entity: "payment_plan",
    fields: [
      "id",
      "order_id",
      "installments.id",
      "installments.sequence",
      "installments.label",
      "installments.amount",
      "installments.status",
    ],
    filters: { id: planId },
  });
  if (!plan) return null;
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "customer.first_name",
      "customer.last_name",
      "customer.phone",
      "shipping_address.phone",
    ],
    filters: { id: plan.order_id },
  });
  if (!order) return null;
  return { order, plan } as PlanContext;
}

async function staffEmails(container: MedusaContainer, role: "finance" | "warehouse") {
  const env = (role === "finance" ? process.env.FINANCE_NOTIFY_EMAILS : process.env.WAREHOUSE_NOTIFY_EMAILS) ?? "";
  const fromEnv = env.split(",").map((s) => s.trim()).filter(Boolean);
  if (fromEnv.length) return fromEnv;
  const userService = container.resolve(Modules.USER);
  const users = await userService.listUsers({}, { select: ["email", "metadata"], take: 200 });
  return users
    .filter((u) => {
      const r = roleFromMetadata(u.metadata ?? null);
      return r === role || r === "owner";
    })
    .map((u) => u.email)
    .filter(Boolean) as string[];
}

async function notify(
  container: MedusaContainer,
  list: { to: string; channel: "whatsapp" | "email"; template: string; data: Record<string, unknown> }[]
) {
  if (!list.length) return;
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const notification = container.resolve(Modules.NOTIFICATION);
  try {
    await notification.createNotifications(list);
  } catch (e) {
    logger.error(`[notify] failed: ${(e as Error).message}`);
  }
}

function customerTargets(ctx: PlanContext) {
  const phone = ctx.order.customer?.phone || ctx.order.shipping_address?.phone || null;
  const email = ctx.order.email || null;
  return { phone, email };
}

function sendCustomer(container: MedusaContainer, ctx: PlanContext, template: string, text: string, subject: string) {
  const { phone, email } = customerTargets(ctx);
  const list: Parameters<typeof notify>[1] = [];
  if (phone) list.push({ to: phone, channel: "whatsapp", template, data: { text } });
  if (email) list.push({ to: email, channel: "email", template, data: { subject, text } });
  return notify(container, list);
}

async function sendStaff(container: MedusaContainer, role: "finance" | "warehouse", template: string, subject: string, text: string) {
  const emails = await staffEmails(container, role);
  if (!emails.length) return;
  return notify(container, [{ to: emails.join(","), channel: "email", template, data: { subject, text } }]);
}

const adminOrderLink = (orderId: string) =>
  `${process.env.ADMIN_URL ?? "http://localhost:9000/app"}/orders/${orderId}`;

const name = (ctx: PlanContext) =>
  [ctx.order.customer?.first_name, ctx.order.customer?.last_name].filter(Boolean).join(" ") || "Pelanggan";

const inst = (ctx: PlanContext, id?: string) =>
  ctx.plan.installments?.find((i) => i.id === id);

export const PlanNotifications = {
  async proofSubmitted(container: MedusaContainer, ctx: PlanContext, installmentId: string) {
    const i = inst(ctx, installmentId);
    await sendStaff(
      container, "finance", "proof-submitted",
      `[待确认到款] 订单 #${ctx.order.display_id} ${i?.label ?? ""}`,
      `客户 ${name(ctx)} 上传了转账凭证。\n订单 #${ctx.order.display_id}，${i?.label ?? ""} ${i ? idr(i.amount) : ""}。\n请核对银行流水后确认：${adminOrderLink(ctx.order.id)}`
    );
    await sendCustomer(
      container, ctx, "proof-received",
      `Halo ${name(ctx)}, bukti transfer untuk pesanan WANGJIA #${ctx.order.display_id} (${i?.label ?? ""}) sudah kami terima. Tim keuangan akan memeriksanya dalam 1 hari kerja.`,
      `Bukti transfer diterima - Pesanan #${ctx.order.display_id}`
    );
  },

  async installmentPaid(container: MedusaContainer, ctx: PlanContext, installmentId: string, releasedNow: boolean) {
    const i = inst(ctx, installmentId);
    await sendCustomer(
      container, ctx, "payment-confirmed",
      `Halo ${name(ctx)}, pembayaran ${i?.label ?? ""} sebesar ${i ? idr(i.amount) : ""} untuk pesanan #${ctx.order.display_id} sudah dikonfirmasi.` +
        (releasedNow ? " Pesanan Anda sekarang disiapkan untuk pengiriman." : ""),
      `Pembayaran dikonfirmasi - Pesanan #${ctx.order.display_id}`
    );
  },

  async released(container: MedusaContainer, ctx: PlanContext) {
    await sendStaff(
      container, "warehouse", "order-released",
      `[可以发货] 订单 #${ctx.order.display_id}`,
      `财务已确认到款，订单 #${ctx.order.display_id}（${name(ctx)}）可以备货发运。\n${adminOrderLink(ctx.order.id)}`
    );
  },

  async proofRejected(container: MedusaContainer, ctx: PlanContext, installmentId: string, reviewNote?: string | null) {
    const i = inst(ctx, installmentId);
    await sendCustomer(
      container, ctx, "proof-rejected",
      `Halo ${name(ctx)}, bukti transfer untuk pesanan #${ctx.order.display_id} (${i?.label ?? ""}) belum bisa kami terima${reviewNote ? `: ${reviewNote}` : ""}. Mohon unggah ulang bukti yang jelas melalui aplikasi.`,
      `Bukti transfer perlu diunggah ulang - Pesanan #${ctx.order.display_id}`
    );
  },

  async refunded(container: MedusaContainer, ctx: PlanContext, installmentId: string, amount: number) {
    const i = inst(ctx, installmentId);
    await sendCustomer(
      container, ctx, "refund-issued",
      `Halo ${name(ctx)}, pengembalian dana ${idr(amount)} untuk pesanan #${ctx.order.display_id} (${i?.label ?? ""}) telah diproses. Dana masuk 1-7 hari kerja tergantung bank.`,
      `Pengembalian dana - Pesanan #${ctx.order.display_id}`
    );
  },

  async cancelled(container: MedusaContainer, ctx: PlanContext, reason?: string | null) {
    await sendCustomer(
      container, ctx, "order-cancelled",
      `Halo ${name(ctx)}, pesanan #${ctx.order.display_id} dibatalkan${reason ? `: ${reason}` : ""}. Hubungi kami via WhatsApp bila ingin memesan kembali.`,
      `Pesanan dibatalkan - Pesanan #${ctx.order.display_id}`
    );
  },

  async shipped(container: MedusaContainer, ctx: PlanContext, tracking: string[]) {
    await sendCustomer(
      container, ctx, "order-shipped",
      `Halo ${name(ctx)}, pesanan WANGJIA #${ctx.order.display_id} sudah dikirim.${tracking.length ? ` No. resi: ${tracking.join(", ")}.` : ""} Pantau status di aplikasi WANGJIA. — PT Adhinusa Lestari Jaya`,
      `Pesanan dikirim - Pesanan #${ctx.order.display_id}`
    );
  },
};
