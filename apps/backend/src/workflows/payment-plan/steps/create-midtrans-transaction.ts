import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";
import {
  buildGatewayOrderId,
  createSnapTransaction,
} from "../../../utils/midtrans";

type Input = {
  installment: {
    id: string;
    label: string;
    amount: number;
    status: string;
    gateway_reference?: string | null;
  };
  order: {
    display_id?: number | string | null;
    email?: string | null;
    customer?: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
    } | null;
  };
  finish_url?: string | null;
};

export const createMidtransTransactionStep = createStep(
  "create-midtrans-transaction",
  async (input: Input, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    const { installment, order } = input;

    if (installment.status === "paid" || installment.status === "cancelled") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Tagihan ini sudah lunas atau dibatalkan."
      );
    }

    const gatewayOrderId = buildGatewayOrderId(installment.id);

    const snap = await createSnapTransaction({
      order_id: gatewayOrderId,
      gross_amount: Number(installment.amount),
      item: {
        id: installment.id,
        name: `Order #${order.display_id ?? ""} - ${installment.label}`,
        price: Number(installment.amount),
        quantity: 1,
      },
      customer: {
        first_name: order.customer?.first_name,
        last_name: order.customer?.last_name,
        email: order.email,
        phone: order.customer?.phone,
      },
      finish_url: input.finish_url ?? process.env.MIDTRANS_FINISH_URL ?? null,
    });

    const previous = {
      id: installment.id,
      gateway_reference: installment.gateway_reference ?? null,
    };

    await service.updatePaymentInstallments({
      id: installment.id,
      gateway_reference: gatewayOrderId,
      payment_method: "midtrans",
    });

    return new StepResponse(
      { ...snap, gateway_order_id: gatewayOrderId },
      previous
    );
  },
  async (previous, { container }) => {
    if (!previous) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    await service.updatePaymentInstallments(previous);
  }
);
