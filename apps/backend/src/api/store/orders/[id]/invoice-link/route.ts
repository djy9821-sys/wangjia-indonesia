import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { assertOrderOwnedByCustomer } from "../../../payment-plans/utils";
import { signInvoiceToken } from "../../../../../utils/invoice";

/* GET /store/orders/:id/invoice-link -> { url } valid 24h, no auth needed to open */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await assertOrderOwnedByCustomer(req.scope, req.params.id, req.auth_context.actor_id);
  const token = signInvoiceToken(req.params.id);
  const base = (process.env.BACKEND_PUBLIC_URL ?? `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  res.json({ url: `${base}/invoices/${token}.pdf`, expires_in: 24 * 3600 });
};
