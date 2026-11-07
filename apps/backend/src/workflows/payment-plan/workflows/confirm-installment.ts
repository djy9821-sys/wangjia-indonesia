import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { InstallmentPaymentMethod } from "../../../types";
import { PaymentPlanEvents } from "../../../utils/payment-plan-events";
import { evaluatePlanReleaseStep } from "../steps/evaluate-plan-release";
import { updateInstallmentsStep } from "../steps/update-installments";
import { updatePaymentProofsStep } from "../steps/update-payment-proofs";
import { validateInstallmentOpenStep } from "../steps/validate-installment-open";

export type ConfirmInstallmentWorkflowInput = {
  installment_id: string;
  actor_id?: string | null;
  payment_method?: InstallmentPaymentMethod;
  proof_id?: string | null;
  note?: string | null;
};

/*
  Finance confirms that money for one installment arrived (bank transfer
  checked against the statement, or any other manual method). Marks the
  installment paid, accepts the proof if one was given, and re-evaluates
  whether the warehouse may ship.
*/
export const confirmInstallmentWorkflow = createWorkflow(
  "confirm-installment",
  (input: ConfirmInstallmentWorkflowInput) => {
    const { data: installments } = useQueryGraphStep({
      entity: "payment_installment",
      fields: ["id", "status", "plan_id", "proofs.id", "proofs.status"],
      filters: { id: input.installment_id },
      options: { throwIfKeyNotFound: true },
    });

    const installment = transform({ installments }, ({ installments }) => installments[0]);

    validateInstallmentOpenStep({
      installment,
      allowed: ["unpaid", "awaiting_confirmation"],
      action: "确认到款",
    });

    const proofUpdates = transform({ input }, ({ input }) =>
      input.proof_id
        ? [
            {
              id: input.proof_id,
              status: "accepted" as const,
              reviewed_by: input.actor_id ?? null,
              reviewed_at: new Date(),
              review_note: input.note ?? null,
            },
          ]
        : []
    );
    updatePaymentProofsStep(proofUpdates);

    const installmentUpdates = transform({ input }, ({ input }) => [
      {
        id: input.installment_id,
        status: "paid" as const,
        payment_method:
          input.payment_method ?? (input.proof_id ? "bank_transfer" : "other"),
        paid_at: new Date(),
        confirmed_by: input.actor_id ?? null,
        confirmed_at: new Date(),
        note: input.note ?? null,
      },
    ]);
    updateInstallmentsStep(installmentUpdates);

    const releaseInput = transform({ installment, input }, ({ installment, input }) => ({
      plan_id: installment.plan_id as string,
      actor_id: input.actor_id ?? null,
    }));
    const release = evaluatePlanReleaseStep(releaseInput);

    const paidEvent = transform({ input, release }, ({ input, release }) => ({
      eventName: PaymentPlanEvents.INSTALLMENT_PAID,
      data: {
        installment_id: input.installment_id,
        plan_id: release.plan_id,
        order_id: release.order_id,
        released_now: release.released_now,
      },
    }));
    emitEventStep(paidEvent).config({ name: "emit-installment-paid" });

    when(release, (r) => r.released_now).then(() => {
      const releasedEvent = transform({ release }, ({ release }) => ({
        eventName: PaymentPlanEvents.RELEASED,
        data: { plan_id: release.plan_id, order_id: release.order_id },
      }));
      emitEventStep(releasedEvent).config({ name: "emit-plan-released" });
    });

    return new WorkflowResponse(release);
  }
);
