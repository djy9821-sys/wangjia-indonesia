import { machineByHandle, machinesForPart } from "@/lib/util/machines"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { ReactNode } from "react"

export type CardPrice = {
  /** The lowest price, formatted. */
  amount: string
  /** The variants cost different amounts: "mulai" (from) goes in front. */
  from?: boolean
  /** Struck through next to the amount when the product is on sale. */
  original?: string | null
  discount?: string | number | null
}

const SIZES = "(max-width: 1023px) 50vw, 25vw"

/*
  The product card of the listing pages and of the related products: a square picture, the
  name and the price. The four machines stand on night water, as on their product pages;
  catalogue photos are multiplied onto a pool of light so their white squares disappear. The
  colours are Medusa UI tokens, so the card is night inside .wj-list (listing.css) and light
  on the paper band under a product page. The name is the link and stretches over the card,
  so an action (quick add) can sit on top without a button inside a link.
*/
export default function ProductCard({
  handle,
  title,
  thumbnail,
  price,
  note,
  action,
}: {
  handle: string
  title: string
  thumbnail?: string | null
  price?: CardPrice | null
  /** A short stock note, e.g. "Stok habis". */
  note?: string | null
  action?: ReactNode
}) {
  const machine = machineByHandle(handle)
  // under the name: what separates the machines (paddles and floats), or the machines a part fits
  const fits = machine ? [] : machinesForPart(handle).map((f) => f.machine.word).sort()
  const line = machine ? machine.specs[0] : fits.length ? `Untuk kincir ${fits.join(" & ")}` : null

  return (
    <div
      data-testid="product-wrapper"
      className="wj-card relative flex h-full flex-col overflow-hidden rounded-2xl bg-ui-bg-base shadow-borders-base transition-shadow duration-150 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[#ffb547]"
    >
      {machine ? (
        <div className="wj-card-stage relative aspect-square">
          <div className="wj-card-reflect" aria-hidden>
            <Image src={machine.image.src} alt="" fill sizes={SIZES} className="object-contain object-bottom" />
          </div>
          <div className="wj-card-machine">
            <Image src={machine.image.src} alt={machine.image.alt} fill sizes={SIZES} className="object-contain object-bottom" />
          </div>
        </div>
      ) : (
        <div className="wj-card-media relative aspect-square">
          {thumbnail && (
            <Image src={thumbnail} alt={title} fill sizes={SIZES} className="object-contain p-[10%] mix-blend-multiply" />
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-3 small:p-4">
        <LocalizedClientLink
          href={`/products/${handle}`}
          className="line-clamp-2 text-[14px] font-medium leading-snug text-ui-fg-base outline-none after:absolute after:inset-0 after:content-[''] small:text-[15px]"
          data-testid="product-title"
        >
          {title}
        </LocalizedClientLink>
        {line && (
          <p className="mt-1 text-[12px] leading-snug text-ui-fg-subtle" data-testid="product-card-line">
            {line}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {price?.original && (
              <p className="text-[12px] text-ui-fg-muted">
                <span className="line-through" data-testid="original-price">{price.original}</span>
                {price.discount ? <span className="ml-1 text-ui-fg-interactive">-{price.discount}%</span> : null}
              </p>
            )}
            {price && (
              // "mulai" may sit above the amount: on a 360 px phone the two do not fit one line of a card
              <p className="flex flex-wrap items-baseline gap-x-1 leading-tight">
                {price.from && <span className="text-[12px] text-ui-fg-muted">mulai</span>}
                <span
                  className={clx(
                    "whitespace-nowrap text-[15px] font-semibold tabular-nums small:text-[16px]",
                    price.original ? "text-ui-fg-interactive" : "text-ui-fg-base"
                  )}
                  data-testid="price"
                >
                  {price.amount}
                </span>
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-ui-fg-muted">{note ?? "Belum termasuk PPN"}</p>
          </div>
          {action && <div className="relative z-[1] shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  )
}
