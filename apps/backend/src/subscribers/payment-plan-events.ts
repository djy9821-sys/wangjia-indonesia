import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PaymentPlanEvents } from "../utils/payment-plan-events";
import {
  loadPlanContext,
  PlanNotifications,
} from "../utils/payment-plan-notifications";

/*
  Turns payment-plan events into WhatsApp / email notifications.
  Providers dry-run to the log until WHATSAPP_* / RESEND_API_KEY are set.
*/
export default async function paymentPlanEventsHandler({
  event,
  container,
}: SubscriberArgs<Record<string, any>>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info(`[payment-plan] ${event.name} ${JSON.stringify(event.data)}`);

  const planId = event.data?.plan_id as string | undefined;
  if (!planId) return;
  const ctx = await loadPlanContext(container, planId);
  if (!ctx) return;

  switch (event.name) {
    case PaymentPlanEvents.PROOF_SUBMITTED:
      return PlanNotifications.proofSubmitted(container, ctx, event.data.installment_id);
    case PaymentPlanEvents.INSTALLMENT_PAID:
      return PlanNotifications.installmentPaid(container, ctx, event.data.installment_id, Boolean(event.data.released_now));
    case PaymentPlanEvents.RELEASED:
      return PlanNotifications.released(container, ctx);
    case PaymentPlanEvents.PROOF_REJECTED:
      return PlanNotifications.proofRejected(container, ctx, event.data.installment_id, event.data.review_note);
    case PaymentPlanEvents.INSTALLMENT_REFUNDED:
      return PlanNotifications.refunded(container, ctx, event.data.installment_id, Number(event.data.amount));
    case PaymentPlanEvents.PLAN_CANCELLED:
      return PlanNotifications.cancelled(container, ctx, event.data.reason);
  }
}

export const config: SubscriberConfig = {
  event: Object.values(PaymentPlanEvents),
};
