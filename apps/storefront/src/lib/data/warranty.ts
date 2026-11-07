"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import medusaError from "@/lib/util/medusa-error"
import { revalidatePath } from "next/cache"

export type StoreWarrantyUnit = {
  id: string
  serial: string
  product_title: string
  variant_title: string | null
  status: string
  registered_at: string | null
  warranty_expires_at: string | null
  farm_location: string | null
  order_id: string | null
}

export const listMyWarrantyUnits = async (): Promise<StoreWarrantyUnit[]> => {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return []
  try {
    const { units } = await sdk.client.fetch<{ units: StoreWarrantyUnit[] }>(
      "/store/warranty/units",
      { headers, cache: "no-store" }
    )
    return units
  } catch {
    return []
  }
}

/* Form action: register the warranty of the unit behind a typed code. */
export const registerWarranty = async (
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> => {
  const code = String(formData.get("code") ?? "").trim()
  const farm_location = String(formData.get("farm_location") ?? "").trim()
  if (!code) return { error: "Masukkan kode dari label QR." }
  try {
    await sdk.client.fetch("/store/warranty/register", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: { code, farm_location: farm_location || null },
    })
    revalidatePath("/[countryCode]/account/garansi", "page")
    return { ok: true }
  } catch (e) {
    return { error: medusaError(e as Error) }
  }
}
