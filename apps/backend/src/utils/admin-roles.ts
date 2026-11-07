export const ADMIN_ROLES = ["owner", "sales", "finance", "warehouse"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: "负责人",
  sales: "销售",
  finance: "财务",
  warehouse: "仓库",
};

export const defaultAdminRole = (): AdminRole => {
  const v = process.env.ADMIN_DEFAULT_ROLE as AdminRole | undefined;
  return v && ADMIN_ROLES.includes(v) ? v : "owner";
};

export const roleFromMetadata = (
  metadata?: Record<string, unknown> | null
): AdminRole => {
  const r = metadata?.role as AdminRole | undefined;
  return r && ADMIN_ROLES.includes(r) ? r : defaultAdminRole();
};
