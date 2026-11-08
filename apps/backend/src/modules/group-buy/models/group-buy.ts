import { model } from "@medusajs/framework/utils";

/*
  Patungan (group buy): one variant offered at a group price until `ends_at`.
  Customers join by ordering the variant at the group price; the order's
  quantity counts toward `min_quantity`.
    open      -> success   joined quantity reached min_quantity before ends_at
    open      -> failed    ends_at passed first (finance refunds / re-prices)
    open      -> cancelled stopped by staff
  Product/variant/price fields are snapshots so the card still renders if the
  catalogue changes later. Amounts are in major units of `currency_code`.
*/
export const GroupBuy = model
  .define("group_buy", {
    id: model.id({ prefix: "gbuy" }).primaryKey(),
    title: model.text(),
    product_id: model.text(),
    product_handle: model.text().nullable(),
    product_title: model.text(),
    variant_id: model.text(),
    variant_title: model.text().nullable(),
    thumbnail: model.text().nullable(),
    currency_code: model.text().default("idr"),
    group_price: model.number(),
    regular_price: model.number().nullable(),
    min_quantity: model.number(),
    max_quantity: model.number().nullable(),
    ends_at: model.dateTime(),
    status: model.enum(["open", "success", "failed", "cancelled"]).default("open"),
    note: model.text().nullable(),
    created_by: model.text().nullable(),
    closed_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["status"] }, { on: ["variant_id"] }, { on: ["ends_at"] }]);
