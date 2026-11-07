import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { ADMIN_ROLES, AdminRole } from "../utils/admin-roles";

/*
  Assign a back-office role to an admin user.

    pnpm medusa exec ./src/scripts/set-admin-role.ts finance@example.com finance

  Roles: owner (everything), sales (quotes, payment plans), finance (confirm
  money, reject receipts), warehouse (fulfill released orders).
*/
export default async function setAdminRole({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const [email, role] = args as [string, AdminRole];

  if (!email || !role || !ADMIN_ROLES.includes(role)) {
    logger.error(
      `用法: medusa exec ./src/scripts/set-admin-role.ts <email> <${ADMIN_ROLES.join("|")}>`
    );
    return;
  }

  const userService = container.resolve(Modules.USER);
  const [user] = await userService.listUsers({ email });
  if (!user) {
    logger.error(`找不到用户 ${email}`);
    return;
  }

  await userService.updateUsers({
    id: user.id,
    metadata: { ...(user.metadata ?? {}), role },
  });
  logger.info(`已将 ${email} 的角色设为 ${role}`);
}
