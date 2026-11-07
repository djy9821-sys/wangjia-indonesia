export const paymentPlanFields = [
  "id",
  "order_id",
  "currency_code",
  "total_amount",
  "release_policy",
  "status",
  "released_at",
  "released_by",
  "note",
  "created_by",
  "created_at",
  "updated_at",
  "installments.*",
  "installments.proofs.*",
  "installments.refunds.*",
];

export const retrievePaymentPlanTransformQueryConfig = {
  defaults: paymentPlanFields,
  isList: false,
};

export const installmentFields = [
  "id",
  "plan_id",
  "sequence",
  "label",
  "amount",
  "due_date",
  "status",
  "payment_method",
  "gateway_reference",
  "paid_at",
  "confirmed_by",
  "confirmed_at",
  "note",
  "created_at",
  "updated_at",
  "proofs.*",
  "refunds.*",
  "plan.*",
];

export const listInstallmentsTransformQueryConfig = {
  defaults: installmentFields,
  isList: true,
};
