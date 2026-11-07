import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { verifyOtp } from "../../../../utils/otp";

/* POST /store/otp/verify { phone, code } -> { verification_token } for sign-up */
export const POST = async (
  req: MedusaRequest<{ phone: string; code: string }>,
  res: MedusaResponse
) => {
  const result = await verifyOtp(req.scope, req.validatedBody.phone, req.validatedBody.code);
  res.json({ verified: true, phone: result.phone, verification_token: result.verification_token });
};
