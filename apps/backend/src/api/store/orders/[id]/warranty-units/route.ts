import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { WARRANTY_MODULE } from "../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../modules/warranty/service";
import { assertOrderOwnedByCustomer } from "../../../payment-plans/utils";

/*
  GET /store/orders/:id/warranty-units — the machines shipped in this order,
  so the buyer can register the warranty with one tap (no scanning needed).
*/
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context.actor_id;
  await assertOrderOwnedByCustomer(req.scope, req.params.id, customerId);
  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const units = await service.listWarrantyUnits({ order_id: req.params.id }, { order: { serial: "ASC" } });
  res.json({
    units: units.map((u) => ({
      id: u.id,
      serial: u.serial,
      product_title: u.product_title,
      variant_title: u.variant_title,
      status: u.status,
      warranty_months: u.warranty_months,
      registered: Boolean(u.customer_id),
      registered_to_me: u.customer_id === customerId,
      registered_at: u.registered_at,
      warranty_expires_at: u.warranty_expires_at,
    })),
  });
};
