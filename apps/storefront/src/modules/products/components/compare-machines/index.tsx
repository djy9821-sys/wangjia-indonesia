import { listProducts } from "@/lib/data/products"
import { getProductPrice } from "@/lib/util/get-product-price"
import { MACHINES } from "@/lib/util/machines"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"

/*
  On a machine's page: the four machines side by side, so a farmer choosing between them does
  not open four pages. Every value is the catalogue's own specification (product metadata
  "spec:<label>"); a row appears when at least two machines have it, and a missing value is a
  dash, never a guess. On phones the table scrolls sideways under a fixed column of labels.
*/
const ROWS = ["Daya motor", "Listrik", "Impeller", "Gearbox", "Luas kolam", "Transfer oksigen", "Pengiriman", "Garansi"]

const MONO = "font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]"
const HEAD = "mt-3 font-[family-name:var(--font-archivo)] [font-stretch:72%] font-extrabold uppercase leading-[0.92] text-[40px] small:text-[56px] text-[var(--text)]"

const spec = (product: HttpTypes.StoreProduct, label: string) => {
  const entry = Object.entries(product.metadata ?? {}).find(
    ([k]) => k.startsWith("spec:") && k.slice(5).replace(/^\d+\s+/, "") === label
  )
  return entry && entry[1] ? String(entry[1]) : null
}

export default async function CompareMachines({
  current,
  region,
  countryCode,
}: {
  current: string
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const { response } = await listProducts({
    // the list does not carry metadata unless asked: the specifications live there
    queryParams: {
      handle: MACHINES.map((m) => m.handle),
      region_id: region.id,
      limit: 10,
      fields: "*variants.calculated_price,+metadata",
    } as HttpTypes.StoreProductParams,
    countryCode,
  })
  // this page's machine first: on a phone it is the column that shows whole
  const cols = [...MACHINES]
    .sort((a, b) => Number(b.handle === current) - Number(a.handle === current))
    .flatMap((machine) => {
      const product = response.products.find((p) => p.handle === machine.handle)
      return product ? [{ machine, product }] : []
    })
  if (cols.length < 2) {
    return null
  }
  const rows = ROWS.map((label) => [label, cols.map((c) => spec(c.product, label))] as const).filter(
    ([, values]) => values.filter(Boolean).length >= 2
  )

  return (
    <div className="border-t border-[var(--line)]">
      <section className="content-container py-14 small:py-20" aria-labelledby="compare-title" data-testid="compare-machines">
        <p className={MONO}>Bandingkan</p>
        <h2 id="compare-title" className={HEAD}>
          Pilih yang pas
        </h2>

        <div className="-mx-4 mt-8 overflow-x-auto px-4 [scrollbar-width:thin] small:mx-0 small:px-0">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[104px] small:w-[160px]" />
              {cols.map((c) => (
                <col key={c.machine.handle} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <td className="sticky left-0 z-[1] bg-[#060b15]" />
                {cols.map(({ machine, product }) => {
                  const here = machine.handle === current
                  const { cheapestPrice } = getProductPrice({ product })
                  return (
                    <th key={machine.handle} scope="col" className={clx("px-3 pb-4 pt-3 align-bottom font-normal", here && "rounded-t-2xl bg-white/[0.04]")}>
                      <LocalizedClientLink href={`/products/${machine.handle}`} className="flex min-h-[44px] flex-col gap-2" aria-current={here ? "page" : undefined}>
                        <span className="relative block h-14 w-full">
                          <Image src={machine.image.src} alt="" fill sizes="160px" className="object-contain object-left-bottom" />
                        </span>
                        <span className="text-[15px] font-semibold leading-snug text-[var(--text)]">{machine.name}</span>
                        {cheapestPrice && (
                          <span className="text-[13px] tabular-nums text-[var(--text-2)]">mulai {cheapestPrice.calculated_price}</span>
                        )}
                        <span className={clx("text-[12px]", here ? "text-[var(--amber)]" : "text-[var(--text-3)] underline underline-offset-4")}>
                          {here ? "Halaman ini" : "Lihat mesin ini"}
                        </span>
                      </LocalizedClientLink>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, values]) => (
                <tr key={label} className="border-t border-[var(--line)]">
                  <th scope="row" className={clx(MONO, "sticky left-0 z-[1] bg-[#060b15] py-3.5 pr-3 align-top")}>
                    {label}
                  </th>
                  {values.map((value, i) => (
                    <td
                      key={cols[i].machine.handle}
                      className={clx("px-3 py-3.5 align-top text-[14px] leading-snug text-[var(--text)]", cols[i].machine.handle === current && "bg-white/[0.04]")}
                    >
                      {value ?? <span className="text-[var(--text-3)]">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-[var(--text-3)]">Angka dari katalog. Tanda – berarti katalog tidak menyebutkannya.</p>
      </section>
    </div>
  )
}
