import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";
import {
  InstallmentPaymentMethod,
  InstallmentStatus,
  ModuleInstallment,
} from "../../../types";

export type UpdateInstallmentInput = {
  id: string;
  status?: InstallmentStatus;
  payment_method?: InstallmentPaymentMethod | null;
  gateway_reference?: string | null;
  gateway_payload?: Record<string, unknown> | null;
  paid_at?: Date | null;
  confirmed_by?: string | null;
  confirmed_at?: Date | null;
  note?: string | null;
};

const SNAPSHOT_KEYS = [
  "status",
  "payment_method",
  "gateway_reference",
  "gateway_payload",
  "paid_at",
  "confirmed_by",
  "confirmed_at",
  "note",
] as const;

export const updateInstallmentsStep = createStep(
  "update-installments",
  async (input: UpdateInstallmentInput[], { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

    if (!input.length) {
      return new StepResponse<ModuleInstallment[], UpdateInstallmentInput[]>([], []);
    }

    const before = await service.listPaymentInstallments({
      id: input.map((i) => i.id),
    });
    const snapshot = before.map((b) => {
      const s: Record<string, unknown> = { id: b.id };
      for (const k of SNAPSHOT_KEYS) {
        s[k] = (b as Record<string, unknown>)[k] ?? null;
      }
      return s as UpdateInstallmentInput;
    });

    const updated = await service.updatePaymentInstallments(input);

    return new StepResponse(updated as unknown as ModuleInstallment[], snapshot);
  },
  async (snapshot, { container }) => {
    if (!snapshot?.length) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.updatePaymentInstallments(snapshot);
  }
);
