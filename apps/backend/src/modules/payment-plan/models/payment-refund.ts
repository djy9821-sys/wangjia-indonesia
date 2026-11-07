import { model } from "@medusajs/framework/utils";
import { Installment } from "./installment";

/*
  Money returned to the customer for one installment. Midtrans payments are
  refunded through the gateway API; bank transfers are wired back manually
  by finance and only recorded here.
*/
export const PaymentRefund = model.define("payment_refund", {
  id: model.id({ prefix: "prefund" }).primaryKey(),
  amount: model.bigNumber(),
  method: model.enum(["midtrans", "bank_transfer", "other"]),
  status: model.enum(["pending", "completed", "failed"]).default("completed"),
  reason: model.text().nullable(),
  gateway_reference: model.text().nullable(),
  gateway_payload: model.json().nullable(),
  bank_account: model.text().nullable(),
  note: model.text().nullable(),
  created_by: model.text().nullable(),
  completed_at: model.dateTime().nullable(),
  installment: model.belongsTo(() => Installment, { mappedBy: "refunds" }),
});
