import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { z } from "@medusajs/framework/zod";
import { normalizePhone, verifiedPhoneFromToken } from "../../../utils/otp";

export const StoreOtpRequest = z.object({ phone: z.string().min(8).max(20) }).strict();
export const StoreOtpVerify = z
  .object({ phone: z.string().min(8).max(20), code: z.string().min(4).max(8) })
  .strict();

/*
  With OTP_REQUIRED=true, creating a customer needs a phone that was just
  verified: header x-phone-verification (from /store/otp/verify) must match
  the phone in the body.
*/
export const requireVerifiedPhone = async (
  req: MedusaRequest<{ phone?: string }>,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (process.env.OTP_REQUIRED !== "true") {
    return next();
  }
  const phone = req.body?.phone ? normalizePhone(req.body.phone) : null;
  const verified = verifiedPhoneFromToken(req.headers["x-phone-verification"] as string | undefined);
  if (!phone || !verified || verified !== phone) {
    return res.status(400).json({
      type: "not_allowed",
      message: "Nomor HP harus diverifikasi dengan kode WhatsApp sebelum mendaftar.",
    });
  }
  return next();
};

export const storeOtpMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/otp/request",
    middlewares: [validateAndTransformBody(StoreOtpRequest)],
  },
  {
    method: ["POST"],
    matcher: "/store/otp/verify",
    middlewares: [validateAndTransformBody(StoreOtpVerify)],
  },
  {
    method: ["POST"],
    matcher: "/store/customers",
    middlewares: [requireVerifiedPhone],
  },
];
