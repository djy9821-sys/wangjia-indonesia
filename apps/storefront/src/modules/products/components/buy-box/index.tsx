"use client"

import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { getProductPrice } from "@/lib/util/get-product-price"
import { isVariantInStock } from "@/lib/util/inventory"
import { whatsappLink } from "@/lib/util/whatsapp"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { useParams } from "next/navigation"
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react"

/*
  The buy box, after the hardware buy pages (DJI Store, Apple): the price with how to pay
  right under it, the variant as large buttons that each show their own price, quantity,
  add to cart and an order on WhatsApp side by side, and a bar that follows at the bottom
  once these scroll away. A machine with two power supplies is never pre-selected: the
  wrong motor is an expensive mistake. Without JavaScript the form posts to /cart/add.
*/

const HIDDEN_VALUES = new Set(["Default option value"])
const label = (v: HttpTypes.StoreProductVariant) =>
  (v.options ?? [])
    .map((o) => o.value ?? "")
    .filter((x) => x && !HIDDEN_VALUES.has(x))
    .join(" · ") ||
  v.title ||
  ""

const MONO = "font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b6f76]"
const PRICE = "font-[family-name:var(--font-archivo)] [font-stretch:85%] font-bold tabular-nums tracking-[-0.01em]"

export default function BuyBox({ product, region }: { product: HttpTypes.StoreProduct; region: HttpTypes.StoreRegion }) {
  const { countryCode } = useParams<{ countryCode: string }>()
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const variants = [...(product.variants ?? [])].sort(
    (a, b) => (a.calculated_price?.calculated_amount ?? Infinity) - (b.calculated_price?.calculated_amount ?? Infinity)
  )
  const choose = variants.length > 1
  const [variantId, setVariantId] = useState(choose ? "" : (variants[0]?.id ?? ""))
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const selected = variants.find((v) => v.id === variantId)
  const inStock = selected ? isVariantInStock(selected) : false
  const optionTitle = product.options?.find((o) => o.title !== "Default option")?.title ?? "varian"
  const { cheapestPrice } = getProductPrice({ product })
  const selectedPrice = selected ? getProductPrice({ product, variantId: selected.id }).variantPrice : null
  const varies = new Set(variants.map((v) => v.calculated_price?.calculated_amount)).size > 1

  // the bar at the bottom appears once the buttons have scrolled above the screen
  const actionsRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const add = (e?: FormEvent) => {
    e?.preventDefault()
    if (!selected || !inStock) {
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    addToCartEventBus.emitCartAdd({ lineItems: [{ productVariant: { ...selected, product }, quantity: qty }], regionId: region.id })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2400)
  }

  const wa = whatsappLink(`Halo WANGJIA, saya mau pesan ${product.title}${choose && selected ? ` (${label(selected)})` : ""}, ${qty} unit.`)
  const shownPrice = selectedPrice?.calculated_price ?? cheapestPrice?.calculated_price
  const addText = added ? "Masuk keranjang ✓" : hydrated && !selected ? `Pilih ${optionTitle.toLowerCase()} dulu` : "Tambah ke keranjang"

  return (
    <>
      <form
        method="post"
        action={`/${countryCode}/cart/add`}
        onSubmit={add}
        className="flex w-full flex-col gap-6"
        data-testid="buy-box"
        {...{
          toolname: "add_to_cart",
          tooldescription: "Add the chosen product variant (variant_id) to the shopping cart with a quantity.",
        }}
      >
        <div>
          <p className="flex flex-wrap items-baseline gap-x-2">
            {!selected && varies && <span className={MONO}>mulai</span>}
            <span className={clx(PRICE, "text-[42px] leading-none")} data-testid="product-price" data-value={(selectedPrice ?? cheapestPrice)?.calculated_price_number}>
              {shownPrice ?? "Tanya harga"}
            </span>
          </p>
          <p className="mt-2 text-[13px] text-[#6b6f76]">Belum termasuk PPN 11% · ongkos kirim dihitung saat checkout</p>
          <p className="mt-3 text-[15px] font-medium text-[#2b2f35]">Bisa bayar bertahap: uang muka dulu, pelunasan sebelum dikirim.</p>
        </div>

        {choose ? (
          <fieldset>
            <legend className={MONO}>Pilih {optionTitle.toLowerCase()}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {variants.map((v) => {
                const stock = isVariantInStock(v)
                const on = v.id === variantId
                return (
                  <label
                    key={v.id}
                    className={clx(
                      "relative flex min-h-[64px] cursor-pointer flex-col justify-center gap-0.5 rounded-2xl border bg-white px-4 py-3 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#ffb547]",
                      on ? "border-[#121417] shadow-[0_0_0_1px_#121417]" : "border-[#dcd7cd] [@media(hover:hover)]:hover:border-[#9a958b]",
                      !stock && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <input type="radio" name="variant_id" value={v.id} checked={on} disabled={!stock} onChange={() => setVariantId(v.id)} className="sr-only" />
                    <span className="text-[15px] font-semibold leading-tight text-[#121417]">{label(v)}</span>
                    <span className="text-[14px] tabular-nums text-[#4a4f57]">{getProductPrice({ product, variantId: v.id }).variantPrice?.calculated_price}</span>
                    {!stock && <span className="text-[12px] text-[#b42318]">Stok habis</span>}
                  </label>
                )
              })}
            </div>
            {optionTitle === "Listrik" && <p className="mt-2 text-[13px] text-[#6b6f76]">1 phase: listrik rumah 220 V. 3 phase: listrik 380 V.</p>}
          </fieldset>
        ) : (
          <input type="hidden" name="variant_id" value={variantId} />
        )}

        <div className="flex items-center gap-4">
          <span className={MONO}>Jumlah</span>
          <div className="flex items-center rounded-full border border-[#dcd7cd] bg-white">
            <button type="button" aria-label="Kurangi jumlah" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center rounded-full text-[20px] active:scale-[0.94]">
              −
            </button>
            <input
              name="quantity"
              inputMode="numeric"
              aria-label="Jumlah"
              value={qty}
              onChange={(e) => setQty(Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              className="w-10 bg-transparent text-center text-[16px] tabular-nums outline-none"
            />
            <button type="button" aria-label="Tambah jumlah" onClick={() => setQty((q) => Math.min(99, q + 1))} className="grid h-11 w-11 place-items-center rounded-full text-[20px] active:scale-[0.94]">
              +
            </button>
          </div>
        </div>

        <div ref={actionsRef} className="grid gap-2">
          <button
            type="submit"
            disabled={hydrated && (!selected || !inStock)}
            data-testid="add-product-button"
            className="h-[52px] rounded-full bg-[#ffb547] px-6 text-[16px] font-semibold text-[#1a1205] transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 [@media(hover:hover)]:hover:bg-[#ffcb80]"
          >
            {addText}
          </button>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#121417] px-6 text-[16px] font-semibold text-[#121417] transition-transform duration-150 active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px] text-[#1a9c4b]" />
            Pesan via WhatsApp
          </a>
        </div>
      </form>

      {/* follows at the bottom, like DJI Store's bar: what you are buying, its price, and the two ways to buy */}
      <div
        className={clx(
          "fixed inset-x-0 bottom-0 z-40 border-t border-[#e3dfd6] bg-white/95 pb-[env(safe-area-inset-bottom)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          stuck ? "translate-y-0" : "translate-y-[calc(100%+24px)]"
        )}
        inert={!stuck}
        data-testid="buy-bar"
      >
        <div className="content-container flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[#4a4f57]">
              {product.title}
              {selected && choose ? ` · ${label(selected)}` : ""}
            </p>
            <p className={clx(PRICE, "text-[20px] leading-tight text-[#121417]")}>
              {!selected && varies ? "mulai " : ""}
              {shownPrice ?? "Tanya harga"}
            </p>
            <p className="hidden text-[12px] text-[#6b6f76] small:block">Kirim ke seluruh Indonesia · belum termasuk PPN 11%</p>
          </div>
          <a href={wa} target="_blank" rel="noreferrer" aria-label="Pesan via WhatsApp" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#121417]">
            <WhatsAppIcon className="h-5 w-5 text-[#1a9c4b]" />
          </a>
          <button type="button" onClick={() => add()} className="h-11 shrink-0 rounded-full bg-[#ffb547] px-5 text-[15px] font-semibold text-[#1a1205] active:scale-[0.97]">
            {selected ? (added ? "✓" : "Tambah") : `Pilih ${optionTitle.toLowerCase()}`}
          </button>
        </div>
      </div>
    </>
  )
}
