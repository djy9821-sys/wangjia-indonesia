import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { WARRANTY_MODULE } from "../../../../modules/warranty";
import WarrantyModuleService from "../../../../modules/warranty/service";
import { extractWarrantyCode } from "../../../../utils/warranty";
import { assertOrderOwnedByCustomer } from "../../payment-plans/utils";
import { registerWarrantyUnitWorkflow } from "../../../../workflows/warranty/workflows/register-warranty-unit";
import { StoreRegisterWarranty } from "../../../admin/warranty/validators";

/* POST /store/warranty/register — activate the warranty of a scanned unit. */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreRegisterWarranty>,
  res: MedusaResponse
) => {
  let code = req.validatedBody.code ? extractWarrantyCode(req.validatedBody.code) : null;
  if (!code && req.validatedBody.unit_id) {
    // One-tap registration from the order screen: the unit must sit in an
    // order that belongs to the caller.
    const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    const unit = await service.retrieveWarrantyUnit(req.validatedBody.unit_id).catch(() => null);
    if (!unit?.order_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Unit tidak ditemukan.");
    }
    await assertOrderOwnedByCustomer(req.scope, unit.order_id, req.auth_context.actor_id);
    code = unit.code;
  }
  if (!code) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Kode QR tidak valid.");
  }
  const { result } = await registerWarrantyUnitWorkflow(req.scope).run({
    input: {
      code,
      customer_id: req.auth_context.actor_id,
      farm_location: req.validatedBody.farm_location ?? null,
    },
  });
  const u = result.unit;
  res.json({
    unit: {
      id: u.id,
      serial: u.serial,
      product_title: u.product_title,
      variant_title: u.variant_title,
      registered_at: u.registered_at,
      warranty_expires_at: u.warranty_expires_at,
      farm_location: u.farm_location,
    },
    first_time: result.first_time,
  });
};
