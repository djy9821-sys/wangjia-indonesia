import { model } from "@medusajs/framework/utils";
import { PaymentPlan } from "./payment-plan";
import { PaymentProof } from "./payment-proof";
import { PaymentRefund } from "./payment-refund";

export const Installment = model.define("payment_installment", {
  id: model.id({ prefix: "pinst" }).primaryKey(),
  sequence: model.number(),
  // Shown to the customer, e.g. "Uang muka 30%" / "Pelunasan 70%".
  label: model.text(),
  amount: model.bigNumber(),
  due_date: model.dateTime().nullable(),
  status: model
    .enum(["unpaid", "awaiting_confirmation", "paid", "refunded", "cancelled"])
    .default("unpaid"),
  refunded_amount: model.bigNumber().default(0),
  payment_method: model
    .enum(["midtrans", "bank_transfer", "other"])
    .nullable(),
  // Midtrans order_id used for this installment, and the last notification.
  gateway_reference: model.text().nullable(),
  gateway_payload: model.json().nullable(),
  paid_at: model.dateTime().nullable(),
  confirmed_by: model.text().nullable(),
  confirmed_at: model.dateTime().nullable(),
  note: model.text().nullable(),
  plan: model.belongsTo(() => PaymentPlan, { mappedBy: "installments" }),
  proofs: model.hasMany(() => PaymentProof, { mappedBy: "installment" }),
  refunds: model.hasMany(() => PaymentRefund, { mappedBy: "installment" }),
});
