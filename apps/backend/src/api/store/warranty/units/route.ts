import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { WARRANTY_MODULE } from "../../../../modules/warranty";
import WarrantyModuleService from "../../../../modules/warranty/service";

/* GET /store/warranty/units — the caller's registered aerators. */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const units = await service.listWarrantyUnits(
    { customer_id: req.auth_context.actor_id },
    { order: { registered_at: "DESC" }, take: 200 }
  );
  res.json({
    units: units.map((u) => ({
      id: u.id,
      serial: u.serial,
      product_title: u.product_title,
      variant_title: u.variant_title,
      status: u.status,
      registered_at: u.registered_at,
      warranty_expires_at: u.warranty_expires_at,
      farm_location: u.farm_location,
      order_id: u.order_id,
    })),
  });
};
