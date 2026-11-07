import { createHash } from "node:crypto";
import { MedusaError } from "@medusajs/framework/utils";

/*
  Minimal Midtrans Snap client.
  Docs: https://docs.midtrans.com/reference/snap-api-overview
*/

export type MidtransSnapResult = {
  token: string;
  redirect_url: string;
};

export type MidtransNotification = {
  order_id: string;
  transaction_id?: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "failure"
    | "refund"
    | "partial_refund"
    | "authorize"
    | string;
  fraud_status?: "accept" | "challenge" | "deny" | string;
  status_code: string;
  gross_amount: string;
  payment_type?: string;
  signature_key: string;
  settlement_time?: string;
  transaction_time?: string;
  [key: string]: unknown;
};

const serverKey = () => process.env.MIDTRANS_SERVER_KEY || "";
const isProduction = () => process.env.MIDTRANS_IS_PRODUCTION === "true";

export const midtransConfigured = () => Boolean(serverKey());

export const midtransSnapBaseUrl = () =>
  isProduction()
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";

export const midtransApiBaseUrl = () =>
  isProduction()
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

const authHeader = () =>
  "Basic " + Buffer.from(`${serverKey()}:`).toString("base64");

export type CreateSnapInput = {
  order_id: string;
  gross_amount: number;
  item: { id: string; name: string; price: number; quantity: number };
  customer: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  finish_url?: string | null;
  expiry_minutes?: number;
};

export async function createSnapTransaction(
  input: CreateSnapInput
): Promise<MidtransSnapResult> {
  if (!midtransConfigured()) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Midtrans 未配置：请在 .env 设置 MIDTRANS_SERVER_KEY"
    );
  }

  // IDR has no decimals; Midtrans rejects fractional gross_amount.
  const gross = Math.round(input.gross_amount);

  const body = {
    transaction_details: { order_id: input.order_id, gross_amount: gross },
    item_details: [
      {
        id: input.item.id,
        name: input.item.name.slice(0, 50),
        price: Math.round(input.item.price),
        quantity: input.item.quantity,
      },
    ],
    customer_details: {
      first_name: input.customer.first_name ?? undefined,
      last_name: input.customer.last_name ?? undefined,
      email: input.customer.email ?? undefined,
      phone: input.customer.phone ?? undefined,
    },
    callbacks: input.finish_url ? { finish: input.finish_url } : undefined,
    expiry: {
      unit: "minutes",
      duration: input.expiry_minutes ?? 24 * 60,
    },
  };

  const res = await fetch(`${midtransSnapBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (Array.isArray(json.error_messages) && json.error_messages.join("; ")) ||
      json.status_message ||
      res.statusText;
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Midtrans 创建交易失败: ${msg}`
    );
  }

  return {
    token: String(json.token),
    redirect_url: String(json.redirect_url),
  };
}

/*
  Midtrans signs notifications with
  sha512(order_id + status_code + gross_amount + server_key).
*/
export function verifyNotificationSignature(n: MidtransNotification): boolean {
  if (!midtransConfigured()) {
    return false;
  }
  const expected = createHash("sha512")
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey()}`)
    .digest("hex");
  return expected === n.signature_key;
}

/*
  Re-fetch a transaction status from Midtrans. Used to double-check a
  notification instead of trusting the pushed payload alone.
*/
export async function getTransactionStatus(
  orderId: string
): Promise<MidtransNotification> {
  const res = await fetch(
    `${midtransApiBaseUrl()}/${encodeURIComponent(orderId)}/status`,
    {
      headers: { Accept: "application/json", Authorization: authHeader() },
    }
  );
  const json = (await res.json()) as MidtransNotification;
  if (!res.ok) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Midtrans 查询状态失败: ${json.status_code}`
    );
  }
  return json;
}

export type MappedGatewayStatus = "paid" | "pending" | "failed" | "ignore";

export function mapTransactionStatus(n: MidtransNotification): MappedGatewayStatus {
  switch (n.transaction_status) {
    case "capture":
      return n.fraud_status === "challenge" ? "pending" : n.fraud_status === "deny" ? "failed" : "paid";
    case "settlement":
      return "paid";
    case "pending":
    case "authorize":
      return "pending";
    case "deny":
    case "cancel":
    case "expire":
    case "failure":
      return "failed";
    default:
      return "ignore";
  }
}

/*
  Midtrans order_id must be unique per attempt; we prefix it with the
  installment id so the webhook can find the installment again.
*/
export function buildGatewayOrderId(installmentId: string): string {
  return `${installmentId}-${Date.now().toString(36)}`;
}

export function installmentIdFromGatewayOrderId(orderId: string): string {
  return orderId.split("-")[0];
}
