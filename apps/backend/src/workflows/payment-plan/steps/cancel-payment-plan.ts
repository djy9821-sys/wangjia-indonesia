import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";

/*
  Cancels a plan and every installment that is not paid. Paid installments
  stay as they are so finance can refund them explicitly.
*/
export const cancelPaymentPlanStep = createStep(
  "cancel-payment-plan",
  async (
    input: { plan_id: string; reason?: string | null; actor_id?: string | null },
    { container }
  ) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    const plan = await service.retrievePaymentPlan(input.plan_id, {
      relations: ["installments"],
    });
    if (plan.status === "cancelled") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "付款计划已经取消");
    }

    const open = (plan.installments ?? []).filter(
      (i) => i.status === "unpaid" || i.status === "awaiting_confirmation"
    );
    const previous = {
      plan: {
        id: plan.id,
        status: plan.status,
        released_at: plan.released_at ?? null,
        note: plan.note ?? null,
      },
      installments: open.map((i) => ({ id: i.id, status: i.status })),
    };

    if (open.length) {
      await service.updatePaymentInstallments(
        open.map((i) => ({ id: i.id, status: "cancelled" as const }))
      );
    }
    const note = input.reason
      ? `${plan.note ? plan.note + "\n" : ""}[Dibatalkan] ${input.reason}`
      : plan.note ?? null;
    await service.updatePaymentPlans({
      id: plan.id,
      status: "cancelled",
      released_at: null,
      note,
    });

    const paidTotal = (plan.installments ?? [])
      .filter((i) => i.status === "paid" || i.status === "refunded")
      .reduce((s, i) => s + Number(i.amount) - Number(i.refunded_amount ?? 0), 0);

    return new StepResponse(
      { plan_id: plan.id, order_id: plan.order_id, outstanding_refund: paidTotal },
      previous
    );
  },
  async (previous, { container }) => {
    if (!previous) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.updatePaymentPlans(previous.plan);
    if (previous.installments.length) {
      await service.updatePaymentInstallments(previous.installments);
    }
  }
);
