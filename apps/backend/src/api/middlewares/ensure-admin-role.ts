import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import {
  AdminRole,
  ADMIN_ROLE_LABELS,
  resolveUserRole,
} from "../../utils/admin-roles";

/*
  Restricts an admin route to users whose `metadata.role` is one of the
  allowed roles. "owner" always passes. See utils/admin-roles for the
  bootstrap rule that applies before any role has been assigned.
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

    const { role } = await resolveUserRole(req.scope, actorId);
    if (role === "owner" || allowed.includes(role)) {
      return next();
    }

    return res.status(403).json({
      message: `此操作需要角色：${allowed
        .map((r) => ADMIN_ROLE_LABELS[r])
        .join(" / ")}（当前：${ADMIN_ROLE_LABELS[role]}）`,
    });
  };
};
