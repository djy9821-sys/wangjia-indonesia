import { model } from "@medusajs/framework/utils";

/*
  One physical aerator (or spare part) with a printed serial number and a QR
  label. The QR carries a random `code`; scanning it proves the unit is a
  genuine WANGJIA product and lets the buyer register the warranty.

  status: in_stock  -> label printed, unit still in the warehouse
          sold      -> shipped against an order (order_id set by warehouse)
          registered-> customer activated the warranty in the app
          void      -> label lost / damaged / recalled; verification fails
*/
export const WarrantyUnit = model
  .define("warranty_unit", {
    id: model.id({ prefix: "wunit" }).primaryKey(),
    serial: model.text(),
    code: model.text(),
    product_id: model.text(),
    variant_id: model.text().nullable(),
    product_title: model.text(),
    variant_title: model.text().nullable(),
    batch: model.text().nullable(),
    status: model.enum(["in_stock", "sold", "registered", "void"]).default("in_stock"),
    warranty_months: model.number().default(12),
    order_id: model.text().nullable(),
    customer_id: model.text().nullable(),
    registered_at: model.dateTime().nullable(),
    registered_name: model.text().nullable(),
    registered_phone: model.text().nullable(),
    farm_location: model.text().nullable(),
    warranty_expires_at: model.dateTime().nullable(),
    scan_count: model.number().default(0),
    last_scanned_at: model.dateTime().nullable(),
    notes: model.text().nullable(),
    created_by: model.text().nullable(),
  })
  .indexes([
    { on: ["serial"], unique: true, where: "deleted_at IS NULL" },
    { on: ["code"], unique: true, where: "deleted_at IS NULL" },
    { on: ["customer_id"] },
    { on: ["order_id"] },
    { on: ["status"] },
    { on: ["batch"] },
  ]);
