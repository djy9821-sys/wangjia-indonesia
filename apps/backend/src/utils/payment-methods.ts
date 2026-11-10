import { midtransConfigured } from "./midtrans";

/*
  How a customer can pay an instalment right now. Sent with the payment plan
  so the app and the web show where to transfer and only offer what works.
*/

// The example account of .env.template. A customer must never be told to
// transfer to it.
const EXAMPLE_ACCOUNT = "1234567890";

/** COMPANY_BANK ("BCA 123 a.n. PT ..."), or null until a real account is set. */
export const transferAccount = (): string | null => {
  const line = (process.env.COMPANY_BANK ?? "").trim();
  return line && !line.includes(EXAMPLE_ACCOUNT) ? line : null;
};

export const storePaymentMethods = () => ({
  bank_transfer: transferAccount(),
  online: midtransConfigured(),
});
