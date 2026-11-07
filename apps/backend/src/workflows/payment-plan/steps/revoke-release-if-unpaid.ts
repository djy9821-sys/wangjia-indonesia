import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";

/*
  After a refund the release policy may no longer hold. If nothing has
  shipped yet, take the order back from the warehouse.
*/
export const revokeReleaseIfUnpaidStep = createStep(
  "revoke-release-if-unpaid",
  async (input: { plan_id: string }, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const plan = await service.retrievePaymentPlan(input.plan_id, {
      relations: ["installments"],
    });
    if (!plan.released_at) {
      return new StepResponse({ revoked: false }, null);
    }

    const installments = [...(plan.installments ?? [])]
      .filter((i) => i.status !== "cancelled")
      .sort((a, b) => a.sequence - b.sequence);
    const allPaid = installments.every((i) => i.status === "paid");
    const depositPaid = installments[0]?.status === "paid";
    const stillSatisfied =
      plan.release_policy === "full_paid" ? allPaid : depositPaid;
    if (stillSatisfied) {
      return new StepResponse({ revoked: false }, null);
    }

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "fulfillments.id", "fulfillments.shipped_at"],
      filters: { id: plan.order_id },
    });
    const shipped = (order?.fulfillments ?? []).some((f: any) => f.shipped_at);
    if (shipped) {
      return new StepResponse({ revoked: false, reason: "already_shipped" }, null);
    }

    const previous = {
      id: plan.id,
      released_at: plan.released_at,
      released_by: plan.released_by ?? null,
      status: plan.status,
    };
    await service.updatePaymentPlans({
      id: plan.id,
      released_at: null,
      released_by: null,
      status: "active",
    });
    return new StepResponse({ revoked: true }, previous);
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
