"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import medusaError from "@/lib/util/medusa-error"

export type StorePaymentProof = {
  id: string
  file_url: string
  bank_name?: string | null
  sender_name?: string | null
  amount?: number | null
  transferred_at?: string | null
  status: "pending" | "accepted" | "rejected"
  review_note?: string | null
  created_at: string
}

export type StorePaymentRefund = {
  id: string
  amount: number
  method: string
  status: string
  reason?: string | null
  completed_at?: string | null
}

export type StoreInstallment = {
  id: string
  sequence: number
  label: string
  amount: number
  due_date?: string | null
  status: "unpaid" | "awaiting_confirmation" | "paid" | "refunded" | "cancelled"
  payment_method?: string | null
  paid_at?: string | null
  refunded_amount?: number
  proofs?: StorePaymentProof[]
  refunds?: StorePaymentRefund[]
}

export type StorePaymentPlan = {
  id: string
  order_id: string
  currency_code: string
  total_amount: number
  release_policy: "deposit_paid" | "full_paid"
  status: "active" | "completed" | "cancelled"
  released_at?: string | null
  note?: string | null
  installments: StoreInstallment[]
  // How the shop takes payment right now: the account for a bank transfer
  // (null until one is set) and whether paying online is on offer.
  payment_methods?: { bank_transfer: string | null; online: boolean }
}

export const retrievePaymentPlan = async (orderId: string) => {
  const headers = { ...(await getAuthHeaders()) }
  return sdk.client
    .fetch<{ payment_plan: StorePaymentPlan | null }>(
      `/store/orders/${orderId}/payment-plan`,
      { method: "GET", headers, cache: "no-store" }
    )
    .then(({ payment_plan }) => payment_plan)
    .catch(() => null)
}

export const createMidtransPayment = async (installmentId: string, finishUrl: string) => {
  const headers = { ...(await getAuthHeaders()) }
  return sdk.client
    .fetch<{ token: string; redirect_url: string }>(
      `/store/payment-installments/${installmentId}/midtrans`,
      { method: "POST", headers, body: { finish_url: finishUrl } }
    )
    .catch((err) => medusaError(err))
}

export const submitPaymentProof = async (
  installmentId: string,
  payload: {
    file: { name: string; mime_type: string; content: string }
    bank_name?: string | null
    sender_name?: string | null
    amount?: number | null
    transferred_at?: string | null
    note?: string | null
  }
) => {
  const headers = { ...(await getAuthHeaders()) }
  return sdk.client
    .fetch<{ payment_plan: StorePaymentPlan }>(
      `/store/payment-installments/${installmentId}/proofs`,
      { method: "POST", headers, body: payload }
    )
    .then(({ payment_plan }) => payment_plan)
    .catch((err) => medusaError(err))
}

export const retrieveInvoiceLink = async (orderId: string) => {
  const headers = { ...(await getAuthHeaders()) }
  return sdk.client
    .fetch<{ url: string }>(`/store/orders/${orderId}/invoice-link`, { method: "GET", headers, cache: "no-store" })
    .then((r) => r.url)
    .catch(() => null)
}
