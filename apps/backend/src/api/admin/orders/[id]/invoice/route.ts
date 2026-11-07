import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { loadInvoiceData, renderInvoicePdf } from "../../../../../utils/invoice";

/* GET /admin/orders/:id/invoice -> PDF */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const data = await loadInvoiceData(req.scope, req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="invoice-${data.order.display_id}.pdf"`);
  renderInvoicePdf(data).pipe(res);
};
