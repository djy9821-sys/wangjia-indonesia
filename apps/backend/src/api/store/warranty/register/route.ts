import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { extractWarrantyCode } from "../../../../utils/warranty";
import { registerWarrantyUnitWorkflow } from "../../../../workflows/warranty/workflows/register-warranty-unit";
import { StoreRegisterWarranty } from "../../../admin/warranty/validators";

/* POST /store/warranty/register — activate the warranty of a scanned unit. */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreRegisterWarranty>,
  res: MedusaResponse
) => {
  const code = extractWarrantyCode(req.validatedBody.code);
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
