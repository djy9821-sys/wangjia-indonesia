import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { WARRANTY_MODULE } from "../../../../../modules/warranty";
import WarrantyModuleService from "../../../../../modules/warranty/service";
import { extractWarrantyCode } from "../../../../../utils/warranty";

/*
  GET /store/warranty/verify/:code — public genuine-product check.
  Returns the same shape whether or not the caller is logged in; the app
  decides what to offer (register / already yours / registered elsewhere).
  Scan counts are kept so an unusually scanned code can be investigated.
*/
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const code = extractWarrantyCode(decodeURIComponent(req.params.code));
  if (!code) {
    return res.json({ genuine: false, reason: "invalid_code" });
  }

  const service = req.scope.resolve<WarrantyModuleService>(WARRANTY_MODULE);
  const [unit] = await service.listWarrantyUnits({ code });
  if (!unit) {
    return res.json({ genuine: false, reason: "unknown" });
  }
  if (unit.status === "void") {
    return res.json({ genuine: false, reason: "void" });
  }

  await service.updateWarrantyUnits({
    id: unit.id,
    scan_count: (unit.scan_count ?? 0) + 1,
    last_scanned_at: new Date(),
  });

  const customerId = (req as any).auth_context?.actor_id as string | undefined;
  res.json({
    genuine: true,
    unit: {
      serial: unit.serial,
      code: unit.code,
      product_title: unit.product_title,
      variant_title: unit.variant_title,
      warranty_months: unit.warranty_months,
      status: unit.status,
      registered: Boolean(unit.customer_id),
      registered_to_me: Boolean(customerId && unit.customer_id === customerId),
      registered_at: unit.registered_at,
      warranty_expires_at: unit.warranty_expires_at,
      // Many scans of one label is a counterfeit signal worth showing.
      scan_count: (unit.scan_count ?? 0) + 1,
    },
  });
};
