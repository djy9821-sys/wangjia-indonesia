import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import {
  AdminRole,
  ADMIN_ROLES,
  clearRoleBootstrapCache,
  roleFromMetadata,
} from "../../../../../utils/admin-roles";

/* POST /admin/team/:id/role { role } — owner only */
export const POST = async (
  req: AuthenticatedMedusaRequest<{ role: AdminRole }>,
  res: MedusaResponse
) => {
  const role = req.validatedBody.role;
  const userService = req.scope.resolve(Modules.USER);
  const user = await userService.retrieveUser(req.params.id);

  // Never let the last owner demote themselves into a locked-out system.
  if (req.params.id === req.auth_context.actor_id && role !== "owner") {
    const users = await userService.listUsers({}, { select: ["id", "metadata"], take: 500 });
    const otherOwners = users.filter(
      (u) => u.id !== user.id && roleFromMetadata(u.metadata ?? null) === "owner" && u.metadata?.role === "owner"
    );
    if (!otherOwners.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "系统至少要保留一个负责人，请先把别人设为负责人"
      );
    }
  }

  await userService.updateUsers({
    id: user.id,
    metadata: { ...(user.metadata ?? {}), role },
  });
  clearRoleBootstrapCache();

  res.json({ id: user.id, email: user.email, role });
};

export const ROLE_VALUES = ADMIN_ROLES;
