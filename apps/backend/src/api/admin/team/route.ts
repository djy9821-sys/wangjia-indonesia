import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLES,
  isRoleBootstrapMode,
  resolveUserRole,
  roleFromMetadata,
} from "../../../utils/admin-roles";

/* GET /admin/team -> every admin user with its role, plus the caller's role */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const userService = req.scope.resolve(Modules.USER);
  const users = await userService.listUsers({}, { take: 500, order: { created_at: "ASC" } });
  const me = await resolveUserRole(req.scope, req.auth_context.actor_id);

  res.json({
    bootstrap: await isRoleBootstrapMode(req.scope),
    me: { id: req.auth_context.actor_id, ...me },
    roles: ADMIN_ROLES.map((r) => ({ value: r, label: ADMIN_ROLE_LABELS[r] })),
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: roleFromMetadata(u.metadata ?? null),
      role_explicit: Boolean(u.metadata?.role),
      created_at: u.created_at,
    })),
  });
};
