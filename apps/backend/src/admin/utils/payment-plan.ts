export const formatMoney = (amount: number | string | null | undefined, currency = "idr") => {
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: currency.toLowerCase() === "idr" ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency.toUpperCase()} ${n.toLocaleString("id-ID")}`;
  }
};

export const formatDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString("zh-CN", { hour12: false }) : "-";

export const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "未付款",
  awaiting_confirmation: "待财务确认",
  paid: "已到账",
  cancelled: "已取消",
};

export const INSTALLMENT_STATUS_COLOR: Record<
  string,
  "grey" | "orange" | "green" | "red" | "blue" | "purple"
> = {
  unpaid: "grey",
  awaiting_confirmation: "orange",
  paid: "green",
  cancelled: "red",
};

export const PROOF_STATUS_LABEL: Record<string, string> = {
  pending: "待审核",
  accepted: "已通过",
  rejected: "已拒绝",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  midtrans: "Midtrans 在线支付",
  bank_transfer: "银行转账",
  other: "其他",
};

export const RELEASE_POLICY_LABEL: Record<string, string> = {
  deposit_paid: "定金到账即可发货",
  full_paid: "全款到账才可发货",
};
