import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../modules/payment-plan";
import PaymentPlanModuleService from "../modules/payment-plan/service";
import { loadPlanContext, PlanNotifications } from "../utils/payment-plan-notifications";

/*
  Daily at 09:00 Jakarta (02:00 UTC): remind customers about installments
  that are due within REMINDER_DAYS_BEFORE days or already overdue, and send
  finance one summary of everything overdue. The cache module de-duplicates
  so each installment gets at most one reminder per day.
*/
export default async function paymentReminders(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const cache = container.resolve(Modules.CACHE);
  const service = container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

  const daysBefore = Number(process.env.REMINDER_DAYS_BEFORE ?? 2);
  const now = Date.now();
  const horizon = now + daysBefore * 86400000;
  const today = new Date().toISOString().slice(0, 10);

  const installments = await service.listPaymentInstallments(
    { status: "unpaid" },
    { relations: ["plan"], take: 2000 }
  );

  const overdueForStaff: string[] = [];
  let sent = 0;
  for (const i of installments) {
    if (!i.due_date || !i.plan || i.plan.status !== "active") continue;
    const due = new Date(i.due_date).getTime();
    if (due > horizon) continue;
    const overdue = due < now;
    const key = `reminder:${i.id}:${today}`;
    if (await cache.get(key)) continue;

    const ctx = await loadPlanContext(container, i.plan.id);
    if (!ctx) continue;
    try {
      await PlanNotifications.installmentDue(container, ctx, i.id, overdue);
      await cache.set(key, 1, 36 * 3600);
      sent++;
      if (overdue) {
        const daysLate = Math.floor((now - due) / 86400000);
        overdueForStaff.push(`#${ctx.order.display_id} · ${i.label} · ${Math.round(Number(i.amount)).toLocaleString("id-ID")} · 逾期 ${daysLate} 天`);
      }
    } catch (e) {
      logger.warn(`[reminder] ${i.id}: ${(e as Error).message}`);
    }
  }

  if (overdueForStaff.length) {
    await PlanNotifications.overdueSummary(container, overdueForStaff);
  }
  if (sent) logger.info(`[reminder] sent ${sent} payment reminder(s), ${overdueForStaff.length} overdue`);
}

export const config = {
  name: "payment-reminders",
  schedule: process.env.REMINDER_CRON ?? "0 2 * * *",
};
