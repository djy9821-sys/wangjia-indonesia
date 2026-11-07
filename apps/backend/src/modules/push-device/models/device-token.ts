import { model } from "@medusajs/framework/utils";

/* One FCM registration token per installed app, owned by a customer. */
export const DeviceToken = model
  .define("push_device_token", {
    id: model.id({ prefix: "pdev" }).primaryKey(),
    customer_id: model.text(),
    token: model.text(),
    platform: model.enum(["ios", "android", "web"]).default("android"),
    app_version: model.text().nullable(),
    locale: model.text().nullable(),
    last_seen_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["token"], unique: true, where: "deleted_at IS NULL" },
    { on: ["customer_id"] },
  ]);
