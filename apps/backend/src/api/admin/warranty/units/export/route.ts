import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { WARRANTY_MODULE } from "../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../modules/warranty/service";
import { warrantyQrUrl } from "../../../../../utils/warranty";
import { AdminExportWarrantyUnits } from "../../validators";

const csv = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/*
  GET /admin/warranty/units/export?batch=…  or  ?ids=a,b,c
  CSV for the label printer: one row per unit with the QR content.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminExportWarrantyUnits>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const { batch, ids } = req.validatedQuery;
  const filters: Record<string, unknown> = {};
  if (batch) filters.batch = batch;
  if (ids) filters.id = ids.split(",").map((s) => s.trim()).filter(Boolean);

  const units = await service.listWarrantyUnits(filters, {
    take: 5000,
    order: { serial: "ASC" },
  });

  const header = ["serial", "code", "qr_url", "product", "variant", "batch", "warranty_months", "status"];
  const rows = units.map((u) => [
    u.serial,
    u.code,
    warrantyQrUrl(u.code),
    u.product_title,
    u.variant_title ?? "",
    u.batch ?? "",
    u.warranty_months,
    u.status,
  ]);
  const body = [header, ...rows].map((r) => r.map(csv).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="wangjia-serial-${batch || "export"}.csv"`
  );
  res.send("﻿" + body);
};
