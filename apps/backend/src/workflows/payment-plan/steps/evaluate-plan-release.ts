import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";

type Input = {
  plan_id: string;
  actor_id?: string | null;
  // Force-release regardless of policy (owner override).
  force?: boolean;
};

export type PlanReleaseResult = {
  plan_id: string;
  order_id: string;
  released: boolean;
  released_now: boolean;
  all_paid: boolean;
};

/*
  Decides whether the warehouse may ship:
    deposit_paid -> the first installment is paid
    full_paid    -> every installment is paid
  Also marks the plan completed once everything is paid.
*/
export const evaluatePlanReleaseStep = createStep(
  "evaluate-payment-plan-release",
  async (input: Input, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

    const plan = await service.retrievePaymentPlan(input.plan_id, {
      relations: ["installments"],
    });

    const installments = [...(plan.installments ?? [])]
      .filter((i) => i.status !== "cancelled")
      .sort((a, b) => a.sequence - b.sequence);

    const allPaid =
      installments.length > 0 && installments.every((i) => i.status === "paid");
    const depositPaid = installments[0]?.status === "paid";
    const policySatisfied =
      plan.release_policy === "full_paid" ? allPaid : depositPaid;
    const shouldRelease = Boolean(input.force) || policySatisfied;

    const previous = {
      id: plan.id,
      released_at: plan.released_at ?? null,
      released_by: plan.released_by ?? null,
      status: plan.status,
    };

    const update: Record<string, unknown> = { id: plan.id };
    let releasedNow = false;

    if (shouldRelease && !plan.released_at) {
      update.released_at = new Date();
      update.released_by = input.actor_id ?? null;
      releasedNow = true;
    }
    if (allPaid && plan.status === "active") {
      update.status = "completed";
    }

    if (Object.keys(update).length > 1) {
      await service.updatePaymentPlans(update as { id: string });
    }

    const result: PlanReleaseResult = {
      plan_id: plan.id,
      order_id: plan.order_id,
      released: Boolean(plan.released_at) || releasedNow,
      released_now: releasedNow,
      all_paid: allPaid,
    };

    return new StepResponse(result, previous);
  },
  async (previous, { container }) => {
    if (!previous) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.updatePaymentPlans(previous);
  }
);
