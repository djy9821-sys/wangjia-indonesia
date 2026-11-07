import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchOrdersById } from "../../payment-plans/utils";

/*
  GET /admin/payment-installments/export?from=YYYY-MM-DD&to=YYYY-MM-DD
  CSV of money received (paid installments) and money returned (refunds) in
  the period, for the accountant / PPN reporting. UTF-8 with BOM so Excel
  opens Indonesian/Chinese text correctly.
*/
const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const day = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(String(req.query.to) + "T23:59:59.999Z") : new Date();

  const { data: installments } = await query.graph({
    entity: "payment_installment",
    fields: [
      "id", "sequence", "label", "amount", "status", "payment_method", "gateway_reference",
      "paid_at", "confirmed_by", "note", "plan.order_id", "plan.currency_code",
      "refunds.id", "refunds.amount", "refunds.method", "refunds.reason", "refunds.bank_account", "refunds.completed_at", "refunds.created_by",
    ],
    filters: { status: ["paid", "refunded"] },
    pagination: { take: 5000, skip: 0, order: { paid_at: "ASC" } },
  });

  const orderIds = Array.from(new Set(installments.map((i: any) => i.plan?.order_id).filter(Boolean)));
  const orders = await fetchOrdersById(req.scope, orderIds as string[]);

  const header = [
    "Tanggal", "Jenis", "Order", "Pelanggan", "Perusahaan", "Email", "Telepon",
    "Tahap", "Jumlah (IDR)", "Metode", "Referensi", "Dikonfirmasi oleh", "Catatan",
  ];
  const rows: string[][] = [];

  for (const i of installments as any[]) {
    const o = orders[i.plan?.order_id] ?? {};
    const customer = [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ");
    const base = [`#${o.display_id ?? ""}`, customer, o.company?.name ?? "", o.email ?? "", o.customer?.phone ?? ""];
    const paidAt = i.paid_at ? new Date(i.paid_at) : null;
    if (paidAt && paidAt >= from && paidAt <= to) {
      rows.push([
        day(paidAt), "Penerimaan", ...base, `${i.sequence}. ${i.label}`, String(Math.round(Number(i.amount))),
        i.payment_method ?? "", i.gateway_reference ?? "", i.confirmed_by ?? "", i.note ?? "",
      ]);
    }
    for (const r of i.refunds ?? []) {
      const at = r.completed_at ? new Date(r.completed_at) : null;
      if (at && at >= from && at <= to) {
        rows.push([
          day(at), "Pengembalian", ...base, `${i.sequence}. ${i.label}`, String(-Math.round(Number(r.amount))),
          r.method ?? "", r.bank_account ?? "", r.created_by ?? "", r.reason ?? "",
        ]);
      }
    }
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));

  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="wangjia-penerimaan-${day(from)}_${day(to)}.csv"`
  );
  res.send(csv);
};
