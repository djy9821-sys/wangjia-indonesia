"use server"

import { sdk } from "@/lib/config"
import { revalidateTag } from "next/cache"
import { getOrSetCart } from "./cart"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"

export type GroupBuy = {
  id: string
  title: string
  product_id: string
  product_handle: string | null
  product_title: string
  variant_id: string
  variant_title: string | null
  thumbnail: string | null
  currency_code: string
  group_price: number
  regular_price: number | null
  min_quantity: number
  max_quantity: number | null
  joined_quantity: number
  participants: number
  remaining_quantity: number | null
  ends_at: string
  status: "open" | "success" | "failed" | "cancelled"
  note: string | null
  created_at: string
}

/** Open patungan (optionally for one product), soonest deadline first. */
export const listGroupBuys = async (productId?: string): Promise<GroupBuy[]> => {
  const next = await getCacheOptions("group-buys")
  const { group_buys } = await sdk.client.fetch<{ group_buys: GroupBuy[] }>("/store/group-buys", {
    method: "GET",
    query: productId ? { product_id: productId } : {},
    next: { ...next, revalidate: 60 },
  })
  return group_buys
}

/**
 * Puts the group-buy variant into the shopper's cart at the group price.
 * Needs a logged-in customer; returns a short Indonesian error otherwise.
 */
export const joinGroupBuy = async (
  id: string,
  quantity: number,
  countryCode: string
): Promise<{ ok: true } | { ok: false; error: string; needsLogin?: boolean }> => {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return { ok: false, error: "Masuk dulu untuk ikut patungan.", needsLogin: true }
  }
  const cart = await getOrSetCart(countryCode)
  if (!cart) return { ok: false, error: "Keranjang belum bisa dibuat. Coba lagi." }
  try {
    await sdk.client.fetch(`/store/group-buys/${id}/join`, {
      method: "POST",
      body: { quantity, cart_id: cart.id },
      headers,
      cache: "no-store",
    })
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Gagal ikut patungan." }
  }
  revalidateTag(await getCacheTag("carts"), { expire: 0 })
  revalidateTag(await getCacheTag("group-buys"), { expire: 0 })
  return { ok: true }
}
