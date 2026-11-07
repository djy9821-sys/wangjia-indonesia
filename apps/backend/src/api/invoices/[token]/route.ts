import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { loadInvoiceData, orderIdFromInvoiceToken, renderInvoicePdf } from "../../../utils/invoice";

/* GET /invoices/:token.pdf — signed, expiring public link (from /store/orders/:id/invoice-link) */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = String(req.params.token).replace(/\.pdf$/, "");
  const orderId = orderIdFromInvoiceToken(token);
  if (!orderId) {
    return res.status(404).json({ message: "Tautan invoice tidak valid atau sudah kedaluwarsa" });
  }
  const data = await loadInvoiceData(req.scope, orderId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="invoice-${data.order.display_id}.pdf"`);
  res.setHeader("Cache-Control", "private, max-age=300");
  renderInvoicePdf(data).pipe(res);
};
