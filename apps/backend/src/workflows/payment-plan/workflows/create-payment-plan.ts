import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import { ReleasePolicy } from "../../../types";
import { createPaymentPlanStep } from "../steps/create-payment-plan";
import { validateOrderForPaymentPlanStep } from "../steps/validate-order-for-payment-plan";

export type CreatePaymentPlanWorkflowInput = {
  order_id: string;
  release_policy?: ReleasePolicy;
  note?: string | null;
  created_by?: string | null;
  installments: {
    label: string;
    amount: number;
    due_date?: string | null;
  }[];
};

/*
  Sales/finance split an order total into installments. The plan is linked
  to the order so `order.payment_plan` resolves in queries.
*/
export const createPaymentPlanWorkflow = createWorkflow(
  "create-payment-plan",
  (input: CreatePaymentPlanWorkflowInput) => {
    const validated = validateOrderForPaymentPlanStep({
      order_id: input.order_id,
      installments: input.installments,
    });

    const planInput = transform({ input, validated }, ({ input, validated }) => ({
      order_id: validated.order_id,
      currency_code: validated.currency_code,
      total_amount: validated.total_amount,
      release_policy: input.release_policy ?? "deposit_paid",
      note: input.note ?? null,
      created_by: input.created_by ?? null,
      installments: input.installments.map((i, idx) => ({
        sequence: idx + 1,
        label: i.label,
        amount: i.amount,
        due_date: i.due_date ? new Date(i.due_date) : null,
      })),
    }));

    const plan = createPaymentPlanStep(planInput);

    const links = transform({ plan }, ({ plan }) => [
      {
        [Modules.ORDER]: { order_id: plan.order_id },
        [PAYMENT_PLAN_MODULE]: { payment_plan_id: plan.id },
      },
    ]);
    createRemoteLinkStep(links);

    return new WorkflowResponse(plan);
  }
);
