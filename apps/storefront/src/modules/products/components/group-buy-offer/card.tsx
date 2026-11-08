import { GroupBuy } from "@/lib/data/group-buys"
import { convertToLocale } from "@/lib/util/money"
import { formatDateId } from "@/lib/util/order-status"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import JoinForm from "./join-form"

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))

/* One patungan: price vs normal, progress toward the minimum, deadline, join. */
const GroupBuyCard = ({ g, countryCode, showProduct = true }: { g: GroupBuy; countryCode: string; showProduct?: boolean }) => {
  const pct = Math.min(100, Math.round((g.joined_quantity / g.min_quantity) * 100))
  const missing = Math.max(0, g.min_quantity - g.joined_quantity)
  const price = (n: number) => convertToLocale({ amount: n, currency_code: g.currency_code })
  const discount = g.regular_price ? Math.round((1 - g.group_price / g.regular_price) * 100) : null
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ui-border-base bg-white p-4 shadow-sm" data-testid="group-buy-card">
      <div className="flex gap-3">
        {showProduct && (
          <LocalizedClientLink href={g.product_handle ? `/products/${g.product_handle}` : "/store"} className="shrink-0">
            <img src={g.thumbnail ?? "/products/aerator-2hp.png"} alt={g.product_title} className="h-20 w-20 rounded-xl object-contain bg-white border border-ui-border-base" />
          </LocalizedClientLink>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-[#0193DE] px-2 py-0.5 text-[11px] font-semibold text-white">PATUNGAN</span>
            {discount !== null && discount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Hemat {discount}%</span>
            )}
          </div>
          <p className="mt-1 font-semibold text-ui-fg-base leading-tight">{g.title}</p>
          {showProduct && (
            <p className="text-xs text-ui-fg-subtle truncate">
              {g.product_title}
              {g.variant_title ? ` · ${g.variant_title}` : ""}
            </p>
          )}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#0E5A8A]">{price(g.group_price)}</span>
            {g.regular_price !== null && <span className="text-xs text-ui-fg-muted line-through">{price(g.regular_price)}</span>}
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-ui-fg-subtle">
          <span>
            Terkumpul <b className="text-ui-fg-base">{g.joined_quantity}</b> dari {g.min_quantity} unit
            {g.participants > 0 ? ` · ${g.participants} peserta` : ""}
          </span>
          <span>{daysLeft(g.ends_at)} hari lagi · s.d. {formatDateId(g.ends_at)}</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ui-bg-subtle">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#0193DE,#0E5A8A)]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-ui-fg-subtle">
          {missing > 0 ? `Kurang ${missing} unit lagi untuk harga patungan.` : "Unit minimum terpenuhi, harga patungan berlaku."}
          {g.max_quantity ? ` Kuota maks ${g.max_quantity} unit.` : ""}
        </p>
      </div>
      {g.note && <p className="text-xs text-ui-fg-subtle">{g.note}</p>}
      <JoinForm id={g.id} countryCode={countryCode} maxQuantity={g.remaining_quantity} compact />
    </div>
  )
}

export default GroupBuyCard
