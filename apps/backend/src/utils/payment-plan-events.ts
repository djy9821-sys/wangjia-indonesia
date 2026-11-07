export const PaymentPlanEvents = {
  INSTALLMENT_PAID: "payment_plan.installment_paid",
  RELEASED: "payment_plan.released",
  PROOF_SUBMITTED: "payment_plan.proof_submitted",
  PROOF_REJECTED: "payment_plan.proof_rejected",
  INSTALLMENT_REFUNDED: "payment_plan.installment_refunded",
  PLAN_CANCELLED: "payment_plan.cancelled",
} as const;
