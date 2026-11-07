import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { WARRANTY_MODULE } from "../../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../../modules/warranty/service";

/* DELETE /admin/orders/:id/warranty-units/:unitId — undo a wrong scan. */
export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const unit = await service.retrieveWarrantyUnit(req.params.unitId);
  if (unit.order_id !== req.params.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "该序列号不属于此订单");
  }
  const updated = await service.updateWarrantyUnits({
    id: unit.id,
    order_id: null,
    status: unit.status === "sold" ? "in_stock" : unit.status,
  });
  res.json({ unit: { id: updated.id, serial: updated.serial, status: updated.status } });
};
