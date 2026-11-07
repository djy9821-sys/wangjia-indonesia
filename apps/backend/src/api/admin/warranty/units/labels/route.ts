import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { WARRANTY_MODULE } from "../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../modules/warranty/service";
import { warrantyQrUrl } from "../../../../../utils/warranty";
import { AdminExportWarrantyUnits } from "../../validators";

/*
  GET /admin/warranty/units/labels?batch=…  or  ?ids=a,b,c
  Ready-to-print A4 sheet of QR labels (3 x 8 per page, 70 x 37 mm, the common
  office sticker layout) so the factory needs no label software: QR, serial,
  product and brand on each sticker.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminExportWarrantyUnits>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const { batch, ids } = req.validatedQuery;
  const filters: Record<string, unknown> = { status: ["in_stock", "sold", "registered"] };
  if (batch) filters.batch = batch;
  if (ids) filters.id = ids.split(",").map((s) => s.trim()).filter(Boolean);
  const units = await service.listWarrantyUnits(filters, { take: 2000, order: { serial: "ASC" } });

  // A4 = 595 x 842 pt. 3 columns x 8 rows, 70 x 37 mm = 198.4 x 104.9 pt.
  const cols = 3, rows = 8, labelW = 198.4, labelH = 104.9;
  const marginX = (595 - cols * labelW) / 2, marginY = (842 - rows * labelH) / 2;
  const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `WANGJIA labels ${batch ?? ""}` } });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const slot = i % (cols * rows);
    if (i > 0 && slot === 0) doc.addPage();
    const x = marginX + (slot % cols) * labelW;
    const y = marginY + Math.floor(slot / cols) * labelH;
    const png = await QRCode.toBuffer(warrantyQrUrl(u.code), { errorCorrectionLevel: "M", margin: 1, width: 300 });
    const qrSize = labelH - 20;
    doc.rect(x + 2, y + 2, labelW - 4, labelH - 4).strokeColor("#ddd").lineWidth(0.5).stroke();
    doc.image(png, x + 8, y + 10, { width: qrSize, height: qrSize });
    const tx = x + 8 + qrSize + 8, tw = labelW - qrSize - 24;
    doc.fillColor("#0E5A8A").font("Helvetica-Bold").fontSize(11).text("WANGJIA", tx, y + 14, { width: tw });
    doc.fillColor("#1B8A5A").font("Helvetica").fontSize(6.5).text("Kincir Air / Aerator", tx, y + 27, { width: tw });
    doc.fillColor("#111").font("Helvetica-Bold").fontSize(10).text(u.serial, tx, y + 42, { width: tw });
    doc.fillColor("#333").font("Helvetica").fontSize(7)
      .text([u.product_title, u.variant_title].filter(Boolean).join(" ").slice(0, 40), tx, y + 56, { width: tw })
      .text(`Kode: ${u.code}`, tx, y + 72, { width: tw })
      .text("Scan untuk cek keaslian & garansi", tx, y + 84, { width: tw });
  }
  if (!units.length) {
    doc.fontSize(12).text("Tidak ada nomor seri untuk dicetak.", 48, 48);
  }
  doc.end();

  const pdf = await done;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="wangjia-label-${batch || "export"}.pdf"`);
  res.send(pdf);
};
