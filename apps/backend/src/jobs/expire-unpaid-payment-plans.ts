import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../modules/payment-plan";
import PaymentPlanModuleService from "../modules/payment-plan/service";
import { cancelPaymentPlanWorkflow } from "../workflows/payment-plan/workflows";

/*
  Hourly: cancel plans whose deposit never arrived.
  A plan expires when it is still unreleased and either
    - the first installment's due_date has passed, or
    - no due_date was set and the plan is older than PAYMENT_PLAN_EXPIRE_DAYS (default 7).
  Installments awaiting finance confirmation are never expired.
*/
export default async function expireUnpaidPaymentPlans(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const service = container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

  const days = Number(process.env.PAYMENT_PLAN_EXPIRE_DAYS ?? 7);
  const now = Date.now();
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);

  const plans = await service.listPaymentPlans(
    { status: "active", released_at: null },
    { relations: ["installments"], take: 500 }
  );

  let cancelled = 0;
  for (const plan of plans) {
    const installments = [...(plan.installments ?? [])].sort(
      (a, b) => a.sequence - b.sequence
    );
    const first = installments[0];
    if (!first || first.status !== "unpaid") {
      continue;
    }
    if (installments.some((i) => i.status === "awaiting_confirmation" || i.status === "paid")) {
      continue;
    }
    const due = first.due_date ? new Date(first.due_date).getTime() : null;
    const expired = due !== null ? due < now : new Date(plan.created_at).getTime() < cutoff.getTime();
    if (!expired) {
      continue;
    }
    try {
      await cancelPaymentPlanWorkflow(container).run({
        input: {
          plan_id: plan.id,
          actor_id: "system",
          reason: due !== null
            ? "Uang muka tidak diterima sampai jatuh tempo"
            : `Uang muka tidak diterima dalam ${days} hari`,
          cancel_order: true,
        },
      });
      cancelled++;
    } catch (e) {
      logger.warn(`[payment-plan] failed to expire ${plan.id}: ${(e as Error).message}`);
    }
  }
  if (cancelled) {
    logger.info(`[payment-plan] expired ${cancelled} unpaid plan(s)`);
  }
}

export const config = {
  name: "expire-unpaid-payment-plans",
  schedule: process.env.PAYMENT_PLAN_EXPIRE_CRON ?? "0 * * * *",
};
