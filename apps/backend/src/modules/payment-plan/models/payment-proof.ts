import { model } from "@medusajs/framework/utils";
import { Installment } from "./installment";

/*
  A bank-transfer receipt ("bukti transfer") uploaded by the customer for one
  installment. Finance accepts or rejects it.
*/
export const PaymentProof = model.define("payment_proof", {
  id: model.id({ prefix: "pproof" }).primaryKey(),
  file_url: model.text(),
  file_id: model.text().nullable(),
  bank_name: model.text().nullable(),
  sender_name: model.text().nullable(),
  amount: model.bigNumber().nullable(),
  transferred_at: model.dateTime().nullable(),
  note: model.text().nullable(),
  status: model.enum(["pending", "accepted", "rejected"]).default("pending"),
  submitted_by: model.text().nullable(),
  reviewed_by: model.text().nullable(),
  reviewed_at: model.dateTime().nullable(),
  review_note: model.text().nullable(),
  installment: model.belongsTo(() => Installment, { mappedBy: "proofs" }),
});
