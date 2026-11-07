import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/*
  07:30 WIB every day: one short Chinese summary for 李总 / the owner(s) of
  what happened in the last 24 h and what needs attention, sent by WhatsApp
  (OWNER_WHATSAPP, comma separated, international format without +) and
  email (OWNER_EMAILS). Silent when neither is configured.
*/
const idr = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default async function ownerDailyDigest(container: MedusaContainer) {
  const phones = (process.env.OWNER_WHATSAPP ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const emails = (process.env.OWNER_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!phones.length && !emails.length) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notification = container.resolve(Modules.NOTIFICATION);
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const now = Date.now();

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "total", "created_at", "status"],
    filters: { created_at: { $gte: since } },
    pagination: { take: 500, skip: 0 },
  });
  const newOrders = (orders as any[]).filter((o) => o.status !== "draft");

  const { data: installments } = await query.graph({
    entity: "payment_installment",
    fields: ["id", "status", "amount", "paid_at", "due_date", "plan.status"],
    pagination: { take: 5000, skip: 0 },
  });
  const paid = (installments as any[]).filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= since);
  const awaiting = (installments as any[]).filter((i) => i.plan?.status === "active" && i.status === "awaiting_confirmation");
  const overdue = (installments as any[]).filter((i) => i.plan?.status === "active" && i.status === "unpaid" && i.due_date && new Date(i.due_date).getTime() < now);

  const { data: quotes } = await query.graph({
    entity: "quote",
    fields: ["id", "status"],
    filters: { status: "pending_merchant" },
    pagination: { take: 500, skip: 0 },
  });

  const { data: units } = await query.graph({
    entity: "warranty_unit",
    fields: ["id", "registered_at", "scan_count", "status"],
    pagination: { take: 10000, skip: 0 },
  });
  const registered = (units as any[]).filter((u) => u.registered_at && new Date(u.registered_at) >= since).length;
  const suspicious = (units as any[]).filter((u) => u.status !== "void" && Number(u.scan_count ?? 0) > 5).length;

  const sum = (list: any[]) => list.reduce((s, i) => s + Number(i.amount ?? i.total ?? 0), 0);
  const date = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Jakarta" });
  const lines = [
    `WANGJIA 印尼 日报 ${date}`,
    `新订单：${newOrders.length} 单，合计 ${idr(sum(newOrders))}`,
    `昨日到账：${paid.length} 笔，合计 ${idr(sum(paid))}`,
    `待财务确认：${awaiting.length} 笔 ${awaiting.length ? idr(sum(awaiting)) : ""}`.trim(),
    `逾期未付：${overdue.length} 笔 ${overdue.length ? idr(sum(overdue)) : ""}`.trim(),
    `待报价：${quotes.length} 个询价`,
    `新登记保修：${registered} 台${suspicious ? `，可疑扫码标签 ${suspicious} 个` : ""}`,
    `后台：${process.env.ADMIN_URL ?? "http://localhost:9000/app"}`,
  ];
  const text = lines.join("\n");

  const sends = [
    ...phones.map((to) => ({ to, channel: "whatsapp", template: "owner-digest", data: { text } })),
    ...(emails.length ? [{ to: emails.join(","), channel: "email", template: "owner-digest", data: { subject: lines[0], text } }] : []),
  ];
  try {
    await notification.createNotifications(sends as any);
    logger.info(`[digest] sent owner digest to ${phones.length} phone(s), ${emails.length} email(s)`);
  } catch (e) {
    logger.error(`[digest] failed: ${(e as Error).message}`);
  }
}

export const config = {
  name: "owner-daily-digest",
  schedule: process.env.OWNER_DIGEST_CRON ?? "30 0 * * *",
};
