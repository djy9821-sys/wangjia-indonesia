import { listGroupBuys } from "@/lib/data/group-buys"
import GroupBuyCard from "./card"

/* Product page: open patungan for this product, if any. */
const GroupBuyOffer = async ({ productId, countryCode }: { productId: string; countryCode: string }) => {
  const groupBuys = await listGroupBuys(productId).catch(() => [])
  if (!groupBuys.length) return null
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ui-fg-subtle">
        Patungan: beberapa petambak pesan bersama, harga turun kalau unit minimum terpenuhi sebelum batas waktu.
        Kalau tidak terpenuhi, pembayaran dikembalikan atau pesanan lanjut dengan harga normal.
      </p>
      {groupBuys.map((g) => (
        <GroupBuyCard key={g.id} g={g} countryCode={countryCode} showProduct={false} />
      ))}
    </div>
  )
}

export default GroupBuyOffer
