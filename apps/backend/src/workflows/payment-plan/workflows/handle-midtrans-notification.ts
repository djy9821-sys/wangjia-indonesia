import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { MidtransNotification } from "../../../utils/midtrans";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import { applyMidtransNotificationStep } from "../steps/apply-midtrans-notification";
import { evaluatePlanReleaseStep } from "../steps/evaluate-plan-release";

/*
  Runs for every verified Midtrans webhook. A settled payment marks the
  installment paid (gateway money is confirmed, no manual finance step) and
  may release the order to the warehouse.
*/
export const handleMidtransNotificationWorkflow = createWorkflow(
  "handle-midtrans-notification",
  (input: MidtransNotification) => {
    const applied = applyMidtransNotificationStep(input);

    const release = evaluatePlanReleaseStep({
      plan_id: applied.plan_id,
      actor_id: "midtrans",
    });

    when(applied, (a) => a.became_paid).then(() => {
      const paidEvent = transform({ applied, release }, ({ applied, release }) => ({
        eventName: PaymentPlanEvents.INSTALLMENT_PAID,
        data: {
          installment_id: applied.installment_id,
          plan_id: applied.plan_id,
          order_id: release.order_id,
          released_now: release.released_now,
        },
      }));
      emitEventStep(paidEvent).config({ name: "emit-installment-paid" });
    });

    when(release, (r) => r.released_now).then(() => {
      const releasedEvent = transform({ release }, ({ release }) => ({
        eventName: PaymentPlanEvents.RELEASED,
        data: { plan_id: release.plan_id, order_id: release.order_id },
      }));
      emitEventStep(releasedEvent).config({ name: "emit-plan-released" });
    });

    const result = transform({ applied, release }, ({ applied, release }) => ({
      ...applied,
      released: release.released,
      released_now: release.released_now,
    }));

    return new WorkflowResponse(result);
  }
);
