import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import {
  refundInstallmentStep,
  RefundInstallmentStepInput,
} from "../steps/refund-installment";
import { revokeReleaseIfUnpaidStep } from "../steps/revoke-release-if-unpaid";

export type RefundInstallmentWorkflowInput = RefundInstallmentStepInput;

/*
  Finance refunds part or all of a paid installment. Midtrans payments go
  back through the gateway; bank transfers are recorded after the manual
  wire. If the deposit is gone and nothing shipped, the warehouse release is
  revoked.
*/
export const refundInstallmentWorkflow = createWorkflow(
  "refund-installment",
  (input: RefundInstallmentWorkflowInput) => {
    const result = refundInstallmentStep(input);

    const revoke = revokeReleaseIfUnpaidStep({ plan_id: result.plan_id });

    const event = transform({ result, revoke, input }, ({ result, revoke, input }) => ({
      eventName: PaymentPlanEvents.INSTALLMENT_REFUNDED,
      data: {
        installment_id: result.installment_id,
        plan_id: result.plan_id,
        refund_id: result.refund.id,
        amount: input.amount,
        fully_refunded: result.fully_refunded,
        release_revoked: revoke.revoked,
      },
    }));
    emitEventStep(event);

    const response = transform({ result, revoke }, ({ result, revoke }) => ({
      ...result,
      release_revoked: revoke.revoked,
    }));
    return new WorkflowResponse(response);
  }
);
