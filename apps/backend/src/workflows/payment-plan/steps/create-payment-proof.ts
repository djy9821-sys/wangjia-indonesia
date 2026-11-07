import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";

export type CreatePaymentProofInput = {
  installment_id: string;
  file_url: string;
  file_id?: string | null;
  bank_name?: string | null;
  sender_name?: string | null;
  amount?: number | null;
  transferred_at?: Date | null;
  note?: string | null;
  submitted_by?: string | null;
};

export const createPaymentProofStep = createStep(
  "create-payment-proof",
  async (input: CreatePaymentProofInput, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    const proof = await service.createPaymentProofs(input);
    return new StepResponse(proof, proof.id);
  },
  async (proofId, { container }) => {
    if (!proofId) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.deletePaymentProofs(proofId);
  }
);
