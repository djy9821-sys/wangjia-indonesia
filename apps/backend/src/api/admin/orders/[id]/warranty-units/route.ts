import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { WARRANTY_MODULE } from "../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../modules/warranty/service";
import { serializeUnit } from "../../../warranty/units/route";
import { AdminLinkWarrantyUnit } from "../../../warranty/validators";

/* GET /admin/orders/:id/warranty-units — serials shipped with this order. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const units = await service.listWarrantyUnits({ order_id: req.params.id }, { order: { serial: "ASC" } });
  res.json({ units: units.map(serializeUnit) });
};

/*
  POST /admin/orders/:id/warranty-units { serial } — warehouse types or scans
  the serial (or the QR code) of the machine going into the crate.
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminLinkWarrantyUnit>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const key = req.validatedBody.serial.trim().toUpperCase();
  const [unit] = await service.listWarrantyUnits({ $or: [{ serial: key }, { code: key }] } as any);
  if (!unit) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `找不到序列号 ${key}`);
  }
  if (unit.status === "void") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `${unit.serial} 已作废`);
  }
  if (unit.order_id && unit.order_id !== req.params.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `${unit.serial} 已关联到其他订单 ${unit.order_id}`);
  }
  const updated = await service.updateWarrantyUnits({
    id: unit.id,
    order_id: req.params.id,
    status: unit.status === "in_stock" ? "sold" : unit.status,
  });
  res.json({ unit: serializeUnit(updated) });
};
