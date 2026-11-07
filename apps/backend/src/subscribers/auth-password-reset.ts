import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/*
  Medusa emits auth.password_reset when POST /auth/customer/emailpass/reset-password
  is called. We mail the customer a link to the storefront reset page; the page
  calls /auth/customer/emailpass/update with the token.
*/
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const notification = container.resolve(Modules.NOTIFICATION);

  const base = (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(/\/$/, "");
  const link = `${base}/id/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.entity_id)}`;

  const isAdmin = data.actor_type === "user";
  const subject = isAdmin ? "Reset kata sandi admin WANGJIA" : "Reset kata sandi akun WANGJIA";
  const text = isAdmin
    ? `Klik tautan berikut untuk mengatur ulang kata sandi admin: ${(process.env.ADMIN_URL ?? "http://localhost:9000/app")}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.entity_id)}\nTautan berlaku 15 menit.`
    : `Halo,\n\nKami menerima permintaan reset kata sandi untuk akun WANGJIA Anda (${data.entity_id}).\nKlik tautan berikut untuk membuat kata sandi baru:\n${link}\n\nTautan berlaku 15 menit. Abaikan email ini jika Anda tidak meminta reset.\n\n— WANGJIA Indonesia / PT Adhinusa Lestari Jaya`;

  try {
    await notification.createNotifications({
      to: data.entity_id,
      channel: "email",
      template: "password-reset",
      data: { subject, text },
    });
  } catch (e) {
    logger.error(`[auth] failed to send reset email: ${(e as Error).message}`);
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
