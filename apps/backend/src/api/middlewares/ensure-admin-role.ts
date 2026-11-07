import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { IUserModuleService } from "@medusajs/framework/types";
import {
  AdminRole,
  ADMIN_ROLE_LABELS,
  roleFromMetadata,
} from "../../utils/admin-roles";

/*
  Restricts an admin route to users whose `metadata.role` is one of the
  allowed roles. "owner" always passes. Users without a role fall back to
  ADMIN_DEFAULT_ROLE (owner in development) so the first admin can set things up.
*/
export const ensureAdminRole = (...allowed: AdminRole[]) => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const actorId = req.auth_context?.actor_id;
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userService = req.scope.resolve<IUserModuleService>(Modules.USER);
    const user = await userService.retrieveUser(actorId).catch(() => null);
    const role = roleFromMetadata(user?.metadata ?? null);

    if (role === "owner" || allowed.includes(role)) {
      return next();
    }

    return res.status(403).json({
      message: `此操作需要角色：${allowed
        .map((r) => ADMIN_ROLE_LABELS[r])
        .join(" / ")}`,
    });
  };
};
