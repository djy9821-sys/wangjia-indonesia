"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import medusaError from "@/lib/util/medusa-error"
import { revalidatePath } from "next/cache"

export type TrackingLabel = {
  tracking_number: string
  courier: string | null
  tracking_url: string | null
  status: string | null
  history: { time: string | null; status: string | null; note: string | null }[]
}
export type Shipment = {
  id: string
  shipped_at: string | null
  delivered_at: string | null
  shipping_option: string | null
  labels: TrackingLabel[]
}
export type OrderUnit = {
  id: string
  serial: string
  product_title: string
  variant_title: string | null
  registered: boolean
  registered_to_me: boolean
  warranty_expires_at: string | null
  warranty_months: number
}

export const listOrderTracking = async (orderId: string): Promise<Shipment[]> => {
  try {
    const { shipments } = await sdk.client.fetch<{ shipments: Shipment[] }>(
      `/store/orders/${orderId}/tracking`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    )
    return shipments
  } catch {
    return []
  }
}

export const listOrderUnits = async (orderId: string): Promise<OrderUnit[]> => {
  try {
    const { units } = await sdk.client.fetch<{ units: OrderUnit[] }>(
      `/store/orders/${orderId}/warranty-units`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    )
    return units
  } catch {
    return []
  }
}

/* One-tap warranty registration for a machine shipped in the customer order. */
export const registerOrderUnit = async (
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> => {
  const unit_id = String(formData.get("unit_id") ?? "")
  try {
    await sdk.client.fetch("/store/warranty/register", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: { unit_id },
    })
    revalidatePath("/[countryCode]/account/orders/details/[id]", "page")
    return { ok: true }
  } catch (e) {
    return { error: medusaError(e as Error) }
  }
}
