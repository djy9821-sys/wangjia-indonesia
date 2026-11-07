import { model } from "@medusajs/framework/utils";
import { Installment } from "./installment";

export const PaymentPlan = model
  .define("payment_plan", {
    id: model.id({ prefix: "pplan" }).primaryKey(),
    order_id: model.text(),
    currency_code: model.text(),
    total_amount: model.bigNumber(),
    // deposit_paid: warehouse may ship once the first installment is paid.
    // full_paid: warehouse may ship only when every installment is paid.
    release_policy: model
      .enum(["deposit_paid", "full_paid"])
      .default("deposit_paid"),
    status: model.enum(["active", "completed", "cancelled"]).default("active"),
    released_at: model.dateTime().nullable(),
    released_by: model.text().nullable(),
    note: model.text().nullable(),
    created_by: model.text().nullable(),
    installments: model.hasMany(() => Installment, { mappedBy: "plan" }),
  })
  .indexes([
    {
      on: ["order_id"],
      unique: true,
      where: "deleted_at IS NULL AND status <> 'cancelled'",
    },
  ]);
