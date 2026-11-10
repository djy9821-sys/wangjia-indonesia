import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { MedusaContainer } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";

/*
  WhatsApp one-time codes for phone verification at sign-up.
  Codes live in the cache module (Redis in production) for OTP_TTL_SECONDS.
  A successful verification returns a short-lived HMAC token the app sends
  back as `x-phone-verification` when creating the customer.
*/
const TTL = Number(process.env.OTP_TTL_SECONDS ?? 300);
const MAX_PER_HOUR = Number(process.env.OTP_MAX_PER_HOUR ?? 5);
const MAX_ATTEMPTS = 5;
const secret = () => process.env.JWT_SECRET ?? "dev-secret";

export const normalizePhone = (raw: string): string => {
  let p = String(raw ?? "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (p.length < 9 || p.length > 15) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Nomor HP tidak valid");
  }
  return p;
};

/*
  Whether a code can reach a phone: WhatsApp is connected, or sign-up insists
  on a code. The app offers "Kirim kode" only then, so nobody waits for a
  message that is never sent.
*/
export const phoneCodesOffered = (): boolean =>
  process.env.OTP_REQUIRED === "true" ||
  Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

type Entry = { code: string; attempts: number };

export async function requestOtp(container: MedusaContainer, rawPhone: string) {
  const cache = container.resolve(Modules.CACHE);
  const phone = normalizePhone(rawPhone);

  const rateKey = `otp:rate:${phone}`;
  const sent = Number((await cache.get<number>(rateKey)) ?? 0);
  if (sent >= MAX_PER_HOUR) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Terlalu banyak permintaan kode. Coba lagi dalam 1 jam."
    );
  }
  await cache.set(rateKey, sent + 1, 3600);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await cache.set(`otp:code:${phone}`, { code, attempts: 0 } satisfies Entry, TTL);

  const notification = container.resolve(Modules.NOTIFICATION);
  await notification.createNotifications({
    to: phone,
    channel: "whatsapp",
    template: "otp",
    data: {
      text: `Kode verifikasi WANGJIA Anda: ${code}. Berlaku ${Math.round(TTL / 60)} menit. Jangan bagikan kode ini.`,
    },
  });

  return { phone, expires_in: TTL };
}

export async function verifyOtp(container: MedusaContainer, rawPhone: string, code: string) {
  const cache = container.resolve(Modules.CACHE);
  const phone = normalizePhone(rawPhone);
  const key = `otp:code:${phone}`;
  const entry = await cache.get<Entry>(key);

  const devCode = process.env.NODE_ENV !== "production" ? process.env.OTP_DEV_CODE : undefined;
  const ok = (entry && entry.code === String(code)) || (devCode && String(code) === devCode);

  if (!ok) {
    if (entry) {
      entry.attempts += 1;
      if (entry.attempts >= MAX_ATTEMPTS) {
        await cache.invalidate(key);
      } else {
        await cache.set(key, entry, TTL);
      }
    }
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Kode salah atau sudah kedaluwarsa");
  }
  await cache.invalidate(key);
  return { phone, verification_token: signPhone(phone) };
}

export function signPhone(phone: string, issuedAt = Date.now()): string {
  const payload = `${phone}.${issuedAt}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/* Returns the verified phone or null. Tokens are valid for 30 minutes. */
export function verifiedPhoneFromToken(token?: string | null): string | null {
  if (!token) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const payload = Buffer.from(p, "base64url").toString();
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  const [phone, issued] = payload.split(".");
  if (Date.now() - Number(issued) > 30 * 60 * 1000) return null;
  return phone;
}
