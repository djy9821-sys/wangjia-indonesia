import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";
import { ModulePaymentProof, PaymentProofStatus } from "../../../types";

export type UpdatePaymentProofInput = {
  id: string;
  status?: PaymentProofStatus;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  review_note?: string | null;
};

export const updatePaymentProofsStep = createStep(
  "update-payment-proofs",
  async (input: UpdatePaymentProofInput[], { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

    if (!input.length) {
      return new StepResponse<ModulePaymentProof[], UpdatePaymentProofInput[]>([], []);
    }

    const before = await service.listPaymentProofs({
      id: input.map((i) => i.id),
    });
    const snapshot: UpdatePaymentProofInput[] = before.map((b) => ({
      id: b.id,
      status: b.status,
      reviewed_by: b.reviewed_by ?? null,
      reviewed_at: b.reviewed_at ?? null,
      review_note: b.review_note ?? null,
    }));

    const updated = await service.updatePaymentProofs(input);
    return new StepResponse(updated as unknown as ModulePaymentProof[], snapshot);
  },
  async (snapshot, { container }) => {
    if (!snapshot?.length) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.updatePaymentProofs(snapshot);
  }
);
