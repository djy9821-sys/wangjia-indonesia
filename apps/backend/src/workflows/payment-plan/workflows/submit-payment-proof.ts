import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import {
  createPaymentProofStep,
  CreatePaymentProofInput,
} from "../steps/create-payment-proof";
import { updateInstallmentsStep } from "../steps/update-installments";
import { validateInstallmentOpenStep } from "../steps/validate-installment-open";

export type SubmitPaymentProofWorkflowInput = Omit<
  CreatePaymentProofInput,
  "transferred_at"
> & { transferred_at?: Date | string | null };

/*
  The customer uploads a bank transfer receipt for an installment. The
  installment moves to "awaiting_confirmation" until finance reviews it.
*/
export const submitPaymentProofWorkflow = createWorkflow(
  "submit-payment-proof",
  (input: SubmitPaymentProofWorkflowInput) => {
    const { data: installments } = useQueryGraphStep({
      entity: "payment_installment",
      fields: ["id", "status", "plan_id"],
      filters: { id: input.installment_id },
      options: { throwIfKeyNotFound: true },
    });
    const installment = transform({ installments }, ({ installments }) => installments[0]);

    validateInstallmentOpenStep({
      installment,
      allowed: ["unpaid", "awaiting_confirmation"],
      action: "上传付款凭证",
      message:
        "Tagihan ini sudah lunas atau dibatalkan. Bukti transfer tidak perlu dikirim lagi.",
    });

    const proofInput = transform({ input }, ({ input }) => ({
      ...input,
      transferred_at: input.transferred_at
        ? new Date(input.transferred_at)
        : null,
    }));
    const proof = createPaymentProofStep(proofInput);

    const updates = transform({ input }, ({ input }) => [
      {
        id: input.installment_id,
        status: "awaiting_confirmation" as const,
        payment_method: "bank_transfer" as const,
      },
    ]);
    updateInstallmentsStep(updates);

    const event = transform({ proof, installment }, ({ proof, installment }) => ({
      eventName: PaymentPlanEvents.PROOF_SUBMITTED,
      data: {
        proof_id: proof.id,
        installment_id: installment.id,
        plan_id: installment.plan_id,
      },
    }));
    emitEventStep(event);

    return new WorkflowResponse(proof);
  }
);
