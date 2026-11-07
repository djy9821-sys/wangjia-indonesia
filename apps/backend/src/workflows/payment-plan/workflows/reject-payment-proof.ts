import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import { updateInstallmentsStep } from "../steps/update-installments";
import { updatePaymentProofsStep } from "../steps/update-payment-proofs";

export type RejectPaymentProofWorkflowInput = {
  proof_id: string;
  actor_id?: string | null;
  review_note?: string | null;
};

/*
  Finance rejects a receipt (wrong amount, unreadable, not found on the
  statement). If no other receipt is pending, the installment returns to
  "unpaid" so the customer can try again.
*/
export const rejectPaymentProofWorkflow = createWorkflow(
  "reject-payment-proof",
  (input: RejectPaymentProofWorkflowInput) => {
    const { data: proofs } = useQueryGraphStep({
      entity: "payment_proof",
      fields: [
        "id",
        "status",
        "installment_id",
        "installment.id",
        "installment.status",
        "installment.plan_id",
        "installment.proofs.id",
        "installment.proofs.status",
      ],
      filters: { id: input.proof_id },
      options: { throwIfKeyNotFound: true },
    });
    const proof = transform({ proofs }, ({ proofs }) => proofs[0]);

    const proofUpdates = transform({ input }, ({ input }) => [
      {
        id: input.proof_id,
        status: "rejected" as const,
        reviewed_by: input.actor_id ?? null,
        reviewed_at: new Date(),
        review_note: input.review_note ?? null,
      },
    ]);
    updatePaymentProofsStep(proofUpdates);

    const installmentUpdates = transform({ proof }, ({ proof }) => {
      const installment = proof.installment;
      const otherPending = (installment?.proofs ?? []).filter(
        (p: { id: string; status: string } | null) =>
          !!p && p.id !== proof.id && p.status === "pending"
      );
      if (
        installment &&
        installment.status === "awaiting_confirmation" &&
        otherPending.length === 0
      ) {
        return [
          {
            id: installment.id as string,
            status: "unpaid" as const,
            payment_method: null,
          },
        ];
      }
      return [];
    });
    updateInstallmentsStep(installmentUpdates);

    const event = transform({ proof }, ({ proof }) => ({
      eventName: PaymentPlanEvents.PROOF_REJECTED,
      data: {
        proof_id: proof.id,
        installment_id: proof.installment_id,
        plan_id: proof.installment?.plan_id,
      },
    }));
    emitEventStep(event);

    return new WorkflowResponse(proof);
  }
);
