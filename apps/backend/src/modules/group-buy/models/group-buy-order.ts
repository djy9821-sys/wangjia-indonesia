import { model } from "@medusajs/framework/utils";

/* One order's participation in a group buy (recorded when the order is placed). */
export const GroupBuyOrder = model
  .define("group_buy_order", {
    id: model.id({ prefix: "gbord" }).primaryKey(),
    group_buy_id: model.text(),
    order_id: model.text(),
    customer_id: model.text().nullable(),
    quantity: model.number(),
    status: model.enum(["joined", "cancelled"]).default("joined"),
  })
  .indexes([
    { on: ["group_buy_id"] },
    { on: ["customer_id"] },
    { on: ["group_buy_id", "order_id"], unique: true, where: "deleted_at IS NULL" },
  ]);
