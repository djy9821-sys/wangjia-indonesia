import { createHmac, timingSafeEqual } from "node:crypto";
import PDFDocument from "pdfkit";
import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { transferAccount } from "./payment-methods";

/*
  Invoice / proforma PDF for an order (Indonesian), including the payment
  plan status. Company details come from env so 李总 can fill NPWP etc.
  Download links are signed (HMAC, 24h) so the app and the web can open
  them in a browser without auth headers.
*/
const company = () => ({
  name: process.env.COMPANY_NAME ?? "PT Adhinusa Lestari Jaya",
  brand: process.env.COMPANY_BRAND ?? "WANGJIA® Kincir Air",
  address: process.env.COMPANY_ADDRESS ?? "Jakarta, Indonesia",
  npwp: process.env.COMPANY_NPWP ?? "-",
  phone: process.env.COMPANY_PHONE ?? "",
  email: process.env.COMPANY_EMAIL ?? "",
  bank: transferAccount() ?? "",
});

// Helvetica has no CJK glyphs: keep the Indonesian part of bilingual labels
// ("Uang muka 30% / 定金" -> "Uang muka 30%").
const latin = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]+/g, "")
    .replace(/\s*\/\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const idr = (n: unknown) => "Rp " + Math.round(Number(n ?? 0)).toLocaleString("id-ID");
const tgl = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-";

const secret = () => process.env.JWT_SECRET ?? "dev-secret";

export function signInvoiceToken(orderId: string, ttlMs = 24 * 3600 * 1000): string {
  const payload = `${orderId}.${Date.now() + ttlMs}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function orderIdFromInvoiceToken(token: string): string | null {
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const payload = Buffer.from(p, "base64url").toString();
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const [orderId, exp] = payload.split(".");
  if (Number(exp) < Date.now()) return null;
  return orderId;
}

export async function loadInvoiceData(container: MedusaContainer, orderId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "created_at", "email", "currency_code",
      "subtotal", "item_subtotal", "shipping_subtotal", "tax_total", "discount_total", "total",
      "customer.first_name", "customer.last_name", "customer.phone", "customer.company_name",
      "company.name", "company.address", "company.phone",
      "shipping_address.*", "billing_address.*",
      "items.title", "items.variant_title", "items.variant_sku", "items.quantity", "items.unit_price", "items.subtotal", "items.tax_total", "items.total",
      "shipping_methods.name", "shipping_methods.amount",
    ],
    filters: { id: orderId },
  });
  if (!order) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found");

  const { data: plans } = await query.graph({
    entity: "payment_plan",
    fields: ["id", "status", "release_policy", "released_at", "installments.sequence", "installments.label", "installments.amount", "installments.status", "installments.paid_at", "installments.refunded_amount"],
    filters: { order_id: orderId },
  });
  const plan = plans.find((p: any) => p.status !== "cancelled") ?? plans[0] ?? null;

  // Machines packed for this order (for the after-sales record on the invoice).
  const { data: units } = await query.graph({
    entity: "warranty_unit",
    fields: ["id", "serial", "product_title", "variant_title", "warranty_months", "status"],
    filters: { order_id: orderId },
  });
  const serials = (units as any[]).filter((u) => u.status !== "void");
  return { order, plan, serials };
}

export function renderInvoicePdf(data: Awaited<ReturnType<typeof loadInvoiceData>>): PDFKit.PDFDocument {
  const { order, plan, serials } = data;
  const c = company();
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Invoice #${order.display_id}`, Author: c.name } });
  const W = doc.page.width - 96;
  const paid = (plan?.installments ?? [])
    .filter((i: any) => i.status === "paid" || i.status === "refunded")
    .reduce((s: number, i: any) => s + Number(i.amount) - Number(i.refunded_amount ?? 0), 0);
  const isProforma = Number(order.total) - paid > 0.5;

  // Header
  doc.fillColor("#0E5A8A").fontSize(22).font("Helvetica-Bold").text(c.brand, 48, 48);
  doc.fillColor("#1B8A5A").fontSize(9).font("Helvetica").text("Aerator tambak udang & ikan", 48, 74);
  doc.fillColor("#111").fontSize(10).font("Helvetica-Bold").text(c.name, 48, 92);
  doc.font("Helvetica").fontSize(9).fillColor("#444")
    .text(c.address, 48, 106, { width: 260 })
    .text(`NPWP: ${c.npwp}`, { width: 260 })
    .text([c.phone, c.email].filter(Boolean).join(" · "), { width: 260 });

  doc.fillColor("#111").font("Helvetica-Bold").fontSize(16)
    .text(isProforma ? "PROFORMA INVOICE" : "INVOICE", 320, 48, { width: W - 272, align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor("#444")
    .text(`No: INV-${new Date(order.created_at).getFullYear()}-${String(order.display_id).padStart(5, "0")}`, 320, 72, { width: W - 272, align: "right" })
    .text(`Tanggal: ${tgl(order.created_at)}`, { width: W - 272, align: "right" })
    .text(`Pesanan: #${order.display_id}`, { width: W - 272, align: "right" });

  // Bill to
  const cust: any = order.customer ?? {};
  const addr: any = order.billing_address ?? order.shipping_address ?? {};
  let y = 150;
  doc.moveTo(48, y).lineTo(48 + W, y).strokeColor("#ddd").stroke();
  y += 10;
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(10).text("Ditagihkan kepada", 48, y);
  doc.font("Helvetica").fontSize(9).fillColor("#333")
    .text([addr.company ?? order.company?.name ?? cust.company_name, [cust.first_name, cust.last_name].filter(Boolean).join(" ")].filter(Boolean).join("\n"), 48, y + 14, { width: 250 })
    .text([addr.address_1, addr.address_2, [addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")].filter(Boolean).join("\n"), { width: 250 })
    .text([cust.phone ?? addr.phone, order.email].filter(Boolean).join(" · "), { width: 250 });

  // Items table
  y = 240;
  const cols = { no: 48, desc: 70, qty: 340, price: 390, total: 470 };
  doc.rect(48, y, W, 18).fill("#0E5A8A");
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9)
    .text("No", cols.no + 4, y + 5).text("Deskripsi", cols.desc, y + 5).text("Qty", cols.qty, y + 5, { width: 40, align: "right" })
    .text("Harga", cols.price, y + 5, { width: 70, align: "right" }).text("Jumlah", cols.total, y + 5, { width: 48 + W - cols.total, align: "right" });
  y += 22;
  doc.fillColor("#111").font("Helvetica").fontSize(9);
  (order.items ?? []).forEach((it: any, idx: number) => {
    const desc = latin([it.title, it.variant_title && it.variant_title !== it.title ? it.variant_title : null, it.variant_sku ? `SKU ${it.variant_sku}` : null].filter(Boolean).join(" · "));
    const h = Math.max(14, doc.heightOfString(desc, { width: cols.qty - cols.desc - 8 }));
    doc.text(String(idx + 1), cols.no + 4, y).text(desc, cols.desc, y, { width: cols.qty - cols.desc - 8 })
      .text(String(it.quantity), cols.qty, y, { width: 40, align: "right" })
      .text(idr(it.unit_price), cols.price, y, { width: 70, align: "right" })
      .text(idr(it.subtotal), cols.total, y, { width: 48 + W - cols.total, align: "right" });
    y += h + 6;
    doc.moveTo(48, y - 2).lineTo(48 + W, y - 2).strokeColor("#eee").stroke();
  });
  if (serials?.length) {
    const line = latin(
      "Nomor seri: " +
        serials.map((u: any) => `${u.serial} (garansi ${u.warranty_months} bln)`).join(", ")
    );
    const h = doc.heightOfString(line, { width: W - 22 });
    doc.fillColor("#444").fontSize(8).text(line, cols.desc, y, { width: W - 22 });
    doc.fillColor("#111").fontSize(9);
    y += h + 6;
  }

  // Totals
  const right = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9).fillColor("#111")
      .text(label, 330, y, { width: 130, align: "right" }).text(value, 470, y, { width: 48 + W - 470, align: "right" });
    y += bold ? 18 : 14;
  };
  y += 6;
  right("Subtotal", idr(order.item_subtotal ?? order.subtotal));
  if (Number(order.shipping_subtotal) > 0) right("Pengiriman", idr(order.shipping_subtotal));
  if (Number(order.discount_total) > 0) right("Diskon", "- " + idr(order.discount_total));
  right("PPN 11%", idr(order.tax_total));
  right("Total", idr(order.total), true);
  if (plan) {
    right("Sudah dibayar", idr(paid));
    right("Sisa", idr(Number(order.total) - paid), true);
  }

  // Payment plan
  if (plan) {
    y += 10;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111").text("Rencana pembayaran", 48, y);
    y += 14;
    const label: Record<string, string> = { unpaid: "Belum dibayar", awaiting_confirmation: "Menunggu konfirmasi", paid: "Lunas", refunded: "Dikembalikan", cancelled: "Dibatalkan" };
    const installments = ([...(plan.installments ?? [])] as any[]).filter(Boolean).sort((a, b) => a.sequence - b.sequence);
    for (const i of installments) {
      doc.font("Helvetica").fontSize(9).fillColor("#333")
        .text(`${i.sequence}. ${latin(i.label)}`, 48, y, { width: 260 })
        .text(idr(i.amount), 310, y, { width: 100, align: "right" })
        .text(`${label[i.status] ?? i.status}${i.paid_at ? " · " + tgl(i.paid_at) : ""}`, 420, y, { width: 48 + W - 420, align: "right" });
      y += 14;
    }
    doc.fontSize(8).fillColor("#666").text(
      plan.release_policy === "full_paid" ? "Barang dikirim setelah seluruh pembayaran dikonfirmasi." : "Barang dikirim setelah uang muka dikonfirmasi.",
      48, y + 2
    );
    y += 16;
  }

  // Payment instructions / footer
  if (c.bank) {
    y += 10;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text("Pembayaran transfer ke:", 48, y);
    doc.font("Helvetica").fontSize(9).fillColor("#333").text(c.bank, 48, y + 12, { width: W });
  }
  doc.fontSize(8).fillColor("#888").text(
    `Dokumen ini dibuat otomatis oleh sistem ${c.brand} dan sah tanpa tanda tangan. ${isProforma ? "Proforma invoice bukan bukti pembayaran." : "Terima kasih atas pembayaran Anda."}`,
    48, doc.page.height - 70, { width: W, align: "center" }
  );
  doc.end();
  return doc;
}
