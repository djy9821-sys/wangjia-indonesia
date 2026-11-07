import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PaymentPlanEvents } from "../utils/payment-plan-events";

/*
  Placeholder notifications. Swap the logger calls for the Notification
  module (email / WhatsApp provider) once a provider is configured:
    - installment paid      -> tell finance + customer
    - plan released         -> tell warehouse to prepare the shipment
    - proof submitted       -> tell finance to review
    - proof rejected        -> tell customer to re-upload
*/
export default async function paymentPlanEventsHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info(`[payment-plan] ${event.name} ${JSON.stringify(event.data)}`);
}

export const config: SubscriberConfig = {
  event: Object.values(PaymentPlanEvents),
};
