import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { requestOtp } from "../../../../utils/otp";

/* POST /store/otp/request { phone } -> WhatsApp code */
export const POST = async (req: MedusaRequest<{ phone: string }>, res: MedusaResponse) => {
  const result = await requestOtp(req.scope, req.validatedBody.phone);
  res.json({ sent: true, phone: result.phone, expires_in: result.expires_in });
};
