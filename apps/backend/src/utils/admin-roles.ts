import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export const ADMIN_ROLES = ["owner", "sales", "finance", "warehouse", "none"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: "负责人 / Pemilik",
  sales: "销售 / Sales",
  finance: "财务 / Keuangan",
  warehouse: "仓库 / Gudang",
  none: "未分配 / Belum ada",
};

export const defaultAdminRole = (): AdminRole => {
  const v = process.env.ADMIN_DEFAULT_ROLE as AdminRole | undefined;
  return v && ADMIN_ROLES.includes(v) ? v : "none";
};

export const roleFromMetadata = (
  metadata?: Record<string, unknown> | null
): AdminRole => {
  const r = metadata?.role as AdminRole | undefined;
  return r && ADMIN_ROLES.includes(r) ? r : defaultAdminRole();
};

/*
  Bootstrap rule: until at least one admin user has an explicit role, every
  admin is treated as owner so the first person can open 团队角色 and assign
  roles. Cached for a minute; assigning a role clears the cache.
*/
let bootstrapCache: { value: boolean; at: number } | null = null;
export const clearRoleBootstrapCache = () => {
  bootstrapCache = null;
};

export async function isRoleBootstrapMode(container: MedusaContainer): Promise<boolean> {
  if (bootstrapCache && Date.now() - bootstrapCache.at < 60_000) {
    return bootstrapCache.value;
  }
  const userService = container.resolve(Modules.USER);
  const users = await userService.listUsers({}, { select: ["id", "metadata"], take: 500 });
  const anyAssigned = users.some((u) => {
    const r = u.metadata?.role as string | undefined;
    return r && ADMIN_ROLES.includes(r as AdminRole) && r !== "none";
  });
  bootstrapCache = { value: !anyAssigned, at: Date.now() };
  return !anyAssigned;
}

export async function resolveUserRole(
  container: MedusaContainer,
  userId: string
): Promise<{ role: AdminRole; bootstrap: boolean }> {
  const userService = container.resolve(Modules.USER);
  const user = await userService.retrieveUser(userId).catch(() => null);
  const explicit = user?.metadata?.role as AdminRole | undefined;
  if (explicit && ADMIN_ROLES.includes(explicit)) {
    return { role: explicit, bootstrap: false };
  }
  if (await isRoleBootstrapMode(container)) {
    return { role: "owner", bootstrap: true };
  }
  return { role: defaultAdminRole(), bootstrap: false };
}
