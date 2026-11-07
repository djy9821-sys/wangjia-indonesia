import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";
import {
  ModuleCreateInstallment,
  ModuleCreatePaymentPlan,
} from "../../../types";

type Input = ModuleCreatePaymentPlan & {
  installments: ModuleCreateInstallment[];
};

export const createPaymentPlanStep = createStep(
  "create-payment-plan",
  async (input: Input, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

    const { installments, ...planData } = input;
    const plan = await service.createPaymentPlans(planData);
    const created = await service.createPaymentInstallments(
      installments.map((i) => ({ ...i, plan_id: plan.id }))
    );

    return new StepResponse({ ...plan, installments: created }, plan.id);
  },
  async (planId, { container }) => {
    if (!planId) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.deletePaymentPlans(planId);
  }
);
