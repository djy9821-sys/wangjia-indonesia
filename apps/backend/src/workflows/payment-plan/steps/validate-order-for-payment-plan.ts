import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  BigNumber,
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";

type Input = {
  order_id: string;
  installments: { amount: number }[];
};

/*
  An order can carry one payment plan, and the installments must add up to
  the order total (IDR has no decimals, so we allow < 1 unit of drift).
*/
export const validateOrderForPaymentPlanStep = createStep(
  "validate-order-for-payment-plan",
  async (input: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [order],
    } = await query.graph(
      {
        entity: "order",
        fields: ["id", "currency_code", "total", "payment_plan.id"],
        filters: { id: input.order_id },
      },
      { throwIfKeyNotFound: true }
    );

    if (order.payment_plan?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "该订单已经有付款计划"
      );
    }

    if (!input.installments.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "付款计划至少需要一期"
      );
    }

    const total = new BigNumber(order.total).numeric;
    const sum = input.installments.reduce((s, i) => s + Number(i.amount), 0);

    if (input.installments.some((i) => Number(i.amount) <= 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "每期金额必须大于 0"
      );
    }

    if (Math.abs(sum - total) >= 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `各期金额合计 ${sum} 与订单总额 ${total} 不一致`
      );
    }

    return new StepResponse({
      order_id: order.id as string,
      currency_code: order.currency_code as string,
      total_amount: total,
    });
  }
);
