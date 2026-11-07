import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { cancelOrderWorkflow, dismissRemoteLinkStep, emitEventStep } from "@medusajs/medusa/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import { cancelPaymentPlanStep } from "../steps/cancel-payment-plan";

export type CancelPaymentPlanWorkflowInput = {
  plan_id: string;
  reason?: string | null;
  actor_id?: string | null;
  // Also cancel the Medusa order (default true). Fails if already shipped.
  cancel_order?: boolean;
};

/*
  Used by finance/sales for abandoned or abusive orders, and by the expiry
  job for plans whose deposit never arrived.
*/
export const cancelPaymentPlanWorkflow = createWorkflow(
  "cancel-payment-plan",
  (input: CancelPaymentPlanWorkflowInput) => {
    const result = cancelPaymentPlanStep({
      plan_id: input.plan_id,
      reason: input.reason,
      actor_id: input.actor_id,
    });

    // Detach the plan from the order so a replacement plan can be created.
    const links = transform({ result }, ({ result }) => [
      {
        [Modules.ORDER]: { order_id: result.order_id },
        [PAYMENT_PLAN_MODULE]: { payment_plan_id: result.plan_id },
      },
    ]);
    dismissRemoteLinkStep(links);

    when({ input }, ({ input }) => input.cancel_order !== false).then(() => {
      const cancelInput = transform({ result, input }, ({ result, input }) => ({
        order_id: result.order_id,
        canceled_by: input.actor_id ?? undefined,
        no_notification: false,
      }));
      cancelOrderWorkflow.runAsStep({ input: cancelInput });
    });

    const event = transform({ result, input }, ({ result, input }) => ({
      eventName: PaymentPlanEvents.PLAN_CANCELLED,
      data: {
        plan_id: result.plan_id,
        order_id: result.order_id,
        reason: input.reason ?? null,
        outstanding_refund: result.outstanding_refund,
      },
    }));
    emitEventStep(event);

    return new WorkflowResponse(result);
  }
);
