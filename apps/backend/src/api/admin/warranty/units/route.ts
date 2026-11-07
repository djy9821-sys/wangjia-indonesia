import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { WARRANTY_MODULE } from "../../../../modules/warranty";
import WarrantyModuleService from "../../../../modules/warranty/service";
import { warrantyQrUrl } from "../../../../utils/warranty";
import { generateWarrantyUnitsWorkflow } from "../../../../workflows/warranty/workflows/generate-warranty-units";
import { AdminGenerateWarrantyUnits, AdminListWarrantyUnits } from "../validators";

export const serializeUnit = (u: any) => ({ ...u, qr_url: warrantyQrUrl(u.code) });

/* GET /admin/warranty/units — search serials / codes / orders, filter by status or batch. */
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminListWarrantyUnits>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const { q, status, batch, limit, offset } = req.validatedQuery;

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (batch) filters.batch = batch;
  if (q) {
    const like = `%${q.trim()}%`;
    filters.$or = [
      { serial: { $ilike: like } },
      { code: { $ilike: like } },
      { batch: { $ilike: like } },
      { order_id: { $ilike: like } },
      { registered_phone: { $ilike: like } },
      { registered_name: { $ilike: like } },
    ];
  }

  const [units, count] = await service.listAndCountWarrantyUnits(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  });

  const [, inStock] = await service.listAndCountWarrantyUnits({ status: "in_stock" }, { take: 1 });
  const [, registered] = await service.listAndCountWarrantyUnits({ status: "registered" }, { take: 1 });
  const [, total] = await service.listAndCountWarrantyUnits({}, { take: 1 });

  res.json({
    units: units.map(serializeUnit),
    count,
    limit,
    offset,
    stats: { in_stock: inStock, registered, total },
  });
};

/* POST /admin/warranty/units — generate a batch of serials + QR codes. */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminGenerateWarrantyUnits>,
  res: MedusaResponse
) => {
  const { result } = await generateWarrantyUnitsWorkflow(req.scope).run({
    input: { ...req.validatedBody, created_by: req.auth_context.actor_id },
  });
  res.status(201).json({ units: result.map(serializeUnit), count: result.length });
};
