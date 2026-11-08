import { listGroupBuys } from "@/lib/data/group-buys"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import GroupBuyCard from "@/modules/products/components/group-buy-offer/card"

/* Home: open patungan, hidden when there are none. */
const GroupBuyStrip = async ({ countryCode }: { countryCode: string }) => {
  const groupBuys = await listGroupBuys().catch(() => [])
  if (!groupBuys.length) return null
  return (
    <section className="content-container py-8" data-testid="group-buy-strip">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl-semi text-ui-fg-base">Patungan sedang berjalan</h2>
          <p className="text-sm text-ui-fg-subtle">Pesan bersama petambak lain, dapat harga grosir.</p>
        </div>
        <LocalizedClientLink href="/patungan" className="text-sm underline text-ui-fg-interactive shrink-0">
          Cara kerja patungan
        </LocalizedClientLink>
      </div>
      <div className="grid gap-4 small:grid-cols-2 medium:grid-cols-3">
        {groupBuys.slice(0, 3).map((g) => (
          <GroupBuyCard key={g.id} g={g} countryCode={countryCode} />
        ))}
      </div>
    </section>
  )
}

export default GroupBuyStrip
