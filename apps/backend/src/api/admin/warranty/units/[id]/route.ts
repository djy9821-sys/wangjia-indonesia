import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { WARRANTY_MODULE } from "../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../modules/warranty/service";
import { AdminUpdateWarrantyUnit } from "../../validators";
import { serializeUnit } from "../route";

/*
  POST /admin/warranty/units/:id — warehouse marks a unit as shipped against
  an order, voids a lost label, or adds a note. A registered unit keeps its
  registration; only the order link / notes change.
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateWarrantyUnit>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const unit = await service.retrieveWarrantyUnit(req.params.id);
  const body = req.validatedBody;

  const update: Record<string, unknown> = { id: unit.id };
  if (body.order_id !== undefined) update.order_id = body.order_id;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.warranty_months !== undefined) update.warranty_months = body.warranty_months;
  if (body.status) {
    if (unit.status === "registered" && body.status !== "void") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "已登记保修的设备只能作废，不能改回库存/已售"
      );
    }
    update.status = body.status;
  } else if (body.order_id && unit.status === "in_stock") {
    update.status = "sold";
  }

  const updated = await service.updateWarrantyUnits(update as any);
  res.json({ unit: serializeUnit(updated) });
};
