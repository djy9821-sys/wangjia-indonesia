import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";
import { InstallmentPaymentMethod } from "../../../types";
import { refundTransaction } from "../../../utils/midtrans";

export type RefundInstallmentStepInput = {
  installment_id: string;
  amount: number;
  reason?: string | null;
  method?: InstallmentPaymentMethod;
  bank_account?: string | null;
  note?: string | null;
  actor_id?: string | null;
};

/*
  Records a refund and, for Midtrans payments, executes it through the
  gateway. Marks the installment "refunded" once everything is returned.
*/
export const refundInstallmentStep = createStep(
  "refund-installment",
  async (input: RefundInstallmentStepInput, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    const installment = await service.retrievePaymentInstallment(
      input.installment_id
    );

    if (installment.status !== "paid" && installment.status !== "refunded") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "只有已到账的款项才能退款"
      );
    }

    const paid = Number(installment.amount);
    const alreadyRefunded = Number(installment.refunded_amount ?? 0);
    const amount = Math.round(Number(input.amount));
    if (!(amount > 0) || amount > paid - alreadyRefunded) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `退款金额必须在 1 到 ${paid - alreadyRefunded} 之间`
      );
    }

    const method: InstallmentPaymentMethod =
      input.method ?? installment.payment_method ?? "other";
    const reason = input.reason ?? "Refund";

    let gatewayPayload: Record<string, unknown> | null = null;
    let gatewayReference: string | null = null;
    if (method === "midtrans") {
      if (!installment.gateway_reference) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "该期款项没有 Midtrans 交易号，无法通过网关退款"
        );
      }
      gatewayReference = `${installment.id}-rf-${Date.now().toString(36)}`;
      gatewayPayload = await refundTransaction(
        installment.gateway_reference,
        amount,
        reason,
        gatewayReference
      );
    }

    const refund = await service.createPaymentRefunds({
      installment_id: installment.id,
      amount,
      method,
      status: "completed",
      reason,
      gateway_reference: gatewayReference,
      gateway_payload: gatewayPayload,
      bank_account: input.bank_account ?? null,
      note: input.note ?? null,
      created_by: input.actor_id ?? null,
      completed_at: new Date(),
    });

    const newRefunded = alreadyRefunded + amount;
    const previous = {
      id: installment.id,
      status: installment.status,
      refunded_amount: alreadyRefunded,
    };
    await service.updatePaymentInstallments({
      id: installment.id,
      refunded_amount: newRefunded,
      status: newRefunded >= paid ? "refunded" : installment.status,
    });

    return new StepResponse(
      {
        refund,
        installment_id: installment.id,
        plan_id: installment.plan_id,
        fully_refunded: newRefunded >= paid,
      },
      { refund_id: refund.id, previous }
    );
  },
  async (comp, { container }) => {
    if (!comp) {
      return;
    }
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);
    // Gateway money cannot be un-refunded; we only roll back our records.
    await service.deletePaymentRefunds(comp.refund_id);
    await service.updatePaymentInstallments(comp.previous);
  }
);
