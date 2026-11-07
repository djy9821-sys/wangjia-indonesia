import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createMidtransTransactionStep } from "../steps/create-midtrans-transaction";

export type CreateMidtransTransactionWorkflowInput = {
  installment_id: string;
  finish_url?: string | null;
};

/*
  Creates a Midtrans Snap transaction for one installment and returns the
  Snap token + redirect URL the app opens.
*/
export const createMidtransTransactionWorkflow = createWorkflow(
  "create-midtrans-transaction",
  (input: CreateMidtransTransactionWorkflowInput) => {
    const { data: installments } = useQueryGraphStep({
      entity: "payment_installment",
      fields: [
        "id",
        "label",
        "amount",
        "status",
        "gateway_reference",
        "plan.order_id",
      ],
      filters: { id: input.installment_id },
      options: { throwIfKeyNotFound: true },
    });
    const installment = transform({ installments }, ({ installments }) => installments[0]);

    const orderFilters = transform({ installment }, ({ installment }) => ({
      id: installment.plan.order_id as string,
    }));
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "customer.first_name",
        "customer.last_name",
        "customer.phone",
      ],
      filters: orderFilters,
      options: { throwIfKeyNotFound: true },
    }).config({ name: "order-query" });

    const stepInput = transform(
      { installment, orders, input },
      ({ installment, orders, input }) => ({
        installment: {
          id: installment.id as string,
          label: installment.label as string,
          amount: Number(installment.amount),
          status: installment.status as string,
          gateway_reference: installment.gateway_reference ?? null,
        },
        order: orders[0],
        finish_url: input.finish_url ?? null,
      })
    );

    const snap = createMidtransTransactionStep(stepInput);

    return new WorkflowResponse(snap);
  }
);
