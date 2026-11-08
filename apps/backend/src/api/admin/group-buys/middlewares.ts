import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { ensureAdminRole } from "../../middlewares/ensure-admin-role";
import { AdminCreateGroupBuy, AdminListGroupBuys, AdminUpdateGroupBuy } from "./validators";

export const adminGroupBuysMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/group-buys",
    middlewares: [validateAndTransformQuery(AdminListGroupBuys, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/group-buys",
    middlewares: [ensureAdminRole("sales"), validateAndTransformBody(AdminCreateGroupBuy)],
  },
  {
    method: ["POST"],
    matcher: "/admin/group-buys/:id",
    middlewares: [ensureAdminRole("sales"), validateAndTransformBody(AdminUpdateGroupBuy)],
  },
];
