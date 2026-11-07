import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { PAYMENT_PLAN_MODULE } from "../../../modules/payment-plan";
import PaymentPlanModuleService from "../../../modules/payment-plan/service";
import {
  installmentIdFromGatewayOrderId,
  mapTransactionStatus,
  MidtransNotification,
} from "../../../utils/midtrans";

export type ApplyNotificationResult = {
  installment_id: string;
  plan_id: string;
  became_paid: boolean;
  mapped: string;
};

/*
  Translates a (verified) Midtrans notification into installment state.
  Idempotent: a settled installment is never downgraded.
*/
export const applyMidtransNotificationStep = createStep(
  "apply-midtrans-notification",
  async (notification: MidtransNotification, { container }) => {
    const service =
      container.resolve<PaymentPlanModuleService>(PAYMENT_PLAN_MODULE);

    const installmentId = installmentIdFromGatewayOrderId(
      notification.order_id
    );
    const installment = await service.retrievePaymentInstallment(installmentId);

    const expected = Math.round(Number(installment.amount));
    const received = Math.round(Number(notification.gross_amount));
    if (expected !== received) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Midtrans 金额 ${received} 与应付 ${expected} 不一致`
      );
    }

    const mapped = mapTransactionStatus(notification);

    const previous = {
      id: installment.id,
      status: installment.status,
      payment_method: installment.payment_method ?? null,
      gateway_reference: installment.gateway_reference ?? null,
      gateway_payload: installment.gateway_payload ?? null,
      paid_at: installment.paid_at ?? null,
      confirmed_by: installment.confirmed_by ?? null,
      confirmed_at: installment.confirmed_at ?? null,
    };

    let becamePaid = false;
    const update: Record<string, unknown> = {
      id: installment.id,
      gateway_reference: notification.order_id,
      gateway_payload: notification,
      payment_method: "midtrans",
    };

    if (installment.status === "paid" || installment.status === "cancelled") {
      // Keep the payload for audit, never change state.
    } else if (mapped === "paid") {
      update.status = "paid";
      update.paid_at = notification.settlement_time
        ? new Date(notification.settlement_time)
        : new Date();
      update.confirmed_by = "midtrans";
      update.confirmed_at = new Date();
      becamePaid = true;
    } else if (mapped === "pending") {
      update.status = "awaiting_confirmation";
    } else if (mapped === "failed") {
      // Back to unpaid so the customer can retry (or transfer manually).
      update.status = "unpaid";
    }

    await service.updatePaymentInstallments(update as { id: string });

    const result: ApplyNotificationResult = {
      installment_id: installment.id,
      plan_id: installment.plan_id,
      became_paid: becamePaid,
      mapped,
    };
    return new StepResponse(result, previous);
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
