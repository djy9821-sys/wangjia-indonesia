import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { ensureAdminRole } from "../../middlewares/ensure-admin-role";
import {
  AdminExportWarrantyUnits,
  AdminGenerateWarrantyUnits,
  AdminListWarrantyUnits,
  AdminUpdateWarrantyUnit,
} from "./validators";

export const adminWarrantyMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/warranty/units",
    middlewares: [validateAndTransformQuery(AdminListWarrantyUnits, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/warranty/units",
    middlewares: [
      ensureAdminRole("warehouse", "sales"),
      validateAndTransformBody(AdminGenerateWarrantyUnits),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/warranty/units/export",
    middlewares: [validateAndTransformQuery(AdminExportWarrantyUnits, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/warranty/units/:id",
    middlewares: [
      ensureAdminRole("warehouse", "sales"),
      validateAndTransformBody(AdminUpdateWarrantyUnit),
    ],
  },
];
