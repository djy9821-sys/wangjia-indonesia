import { MedusaRequest } from "@medusajs/framework";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/*
  Brute-force / abuse protection for the public endpoints.
  In-memory counters are fine for one instance; with several instances put
  a Redis store behind express-rate-limit. Disable in tests with
  RATE_LIMIT_DISABLED=true.
*/
const disabled = () => process.env.RATE_LIMIT_DISABLED === "true";

/* First hop of X-Forwarded-For (Caddy sets it); IPv6 is bucketed by /56 via the helper. */
const keyByIp = (req: MedusaRequest) => {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown";
  return ipKeyGenerator(ip, 56);
};

const make = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: keyByIp as any,
    skip: () => disabled(),
    message: { type: "not_allowed", message },
  });

/* Login / password reset: 20 attempts per 15 min per IP */
export const authRateLimit = make(15 * 60 * 1000, 20, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
/* OTP request/verify: 10 per 15 min per IP (per-phone limits live in utils/otp) */
export const otpRateLimit = make(15 * 60 * 1000, 10, "Terlalu banyak permintaan kode. Coba lagi nanti.");
/* Sign-up and quote requests: 10 per hour per IP */
export const signupRateLimit = make(60 * 60 * 1000, 10, "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.");
/* Receipt uploads: 30 per hour per IP */
export const uploadRateLimit = make(60 * 60 * 1000, 30, "Terlalu banyak unggahan. Coba lagi nanti.");
/* Public genuine-product check: generous, but stops bulk code guessing. */
export const verifyRateLimit = make(15 * 60 * 1000, 120, "Terlalu banyak pemeriksaan. Coba lagi nanti.");
