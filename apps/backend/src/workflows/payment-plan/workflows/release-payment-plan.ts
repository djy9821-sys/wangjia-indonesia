import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import { evaluatePlanReleaseStep } from "../steps/evaluate-plan-release";

export type ReleasePaymentPlanWorkflowInput = {
  plan_id: string;
  actor_id?: string | null;
};

/*
  Owner override: release the order to the warehouse before the policy is
  met (e.g. a trusted customer, or payment arrived through another channel).
*/
export const releasePaymentPlanWorkflow = createWorkflow(
  "release-payment-plan",
  (input: ReleasePaymentPlanWorkflowInput) => {
    const release = evaluatePlanReleaseStep({
      plan_id: input.plan_id,
      actor_id: input.actor_id,
      force: true,
    });

    when(release, (r) => r.released_now).then(() => {
      const releasedEvent = transform({ release }, ({ release }) => ({
        eventName: PaymentPlanEvents.RELEASED,
        data: { plan_id: release.plan_id, order_id: release.order_id },
      }));
      emitEventStep(releasedEvent);
    });

    return new WorkflowResponse(release);
  }
);
