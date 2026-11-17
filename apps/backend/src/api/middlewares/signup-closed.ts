import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework";

/*
  Until the shop opens, SIGNUP_CLOSED=true keeps new accounts out. The app
  hides its sign-up form (it reads `signup` from /store/app-version) and this
  refuses the request from older apps and the web shop. Existing customers
  sign in as before. Leave it unset on the live server.
*/
export const signupOpen = (): boolean => process.env.SIGNUP_CLOSED !== "true";

export const refuseClosedSignup = (_req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  if (signupOpen()) {
    return next();
  }
  return res.status(400).json({
    type: "not_allowed",
    message: "Pendaftaran akun baru belum dibuka. Hubungi WANGJIA untuk mendapatkan akun.",
  });
};
