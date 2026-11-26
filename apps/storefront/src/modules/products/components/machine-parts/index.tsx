import { listProducts } from "@/lib/data/products"
import { getProductPrice } from "@/lib/util/get-product-price"
import { MachineInfo } from "@/lib/util/machines"
import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

/*
  On a machine's page: every spare part it is made of, with how many it carries and the price,
  each a link to the part's own page. This is the brand's promise made checkable (a broken
  part is replaced alone), and local competitors show no part prices at all. The list and the
  counts come from the catalogue's packing lists (lib/util/machines.ts); prices from the shop.
*/
const MONO = "font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]"
const HEAD = "mt-3 font-[family-name:var(--font-archivo)] [font-stretch:72%] font-extrabold uppercase leading-[0.92] text-[40px] small:text-[56px] text-[var(--text)]"

// "Impeller (Kipas) Kincir WANGJIA" reads as "Impeller (Kipas)" under a heading that names the machine
const shortName = (title: string) => title.replace(/\s+(Kincir\s+)?WANGJIA\b.*$/i, "")

export default async function MachineParts({
  machine,
  region,
  countryCode,
}: {
  machine: MachineInfo
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const wanted = machine.parts ?? []
  if (!wanted.length) {
    return null
  }

  const { response } = await listProducts({
    queryParams: { handle: wanted.map((p) => p.handle), region_id: region.id, limit: 50 } as HttpTypes.StoreProductParams,
    countryCode,
  })
  const byHandle = new Map(response.products.map((p) => [p.handle, p]))
  const rows = wanted.flatMap((part) => {
    const product = byHandle.get(part.handle)
    return product ? [{ part, product }] : []
  })
  if (!rows.length) {
    return null
  }

  return (
    <div className="border-t border-[var(--line)]">
      <section
        className="content-container grid gap-8 py-14 small:grid-cols-12 small:gap-12 small:py-20"
        aria-labelledby="parts-title"
        data-testid="machine-parts"
      >
        <div className="small:col-span-4">
          <p className={MONO}>Suku cadang</p>
          <h2 id="parts-title" className={HEAD}>
            Satu rusak, ganti satu
          </h2>
          <p className="mt-4 max-w-[36ch] text-[16px] leading-relaxed text-[var(--text-2)]">
            {rows.length} bagian {machine.name} dijual satuan, harganya tertulis di sini.
          </p>
          {/* a farmer often knows what broke only by sight: a photo settles it */}
          <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-[var(--text-2)]">
            Tidak yakin bagian mana yang rusak?{" "}
            <a
              href={whatsappLink(`Halo WANGJIA, saya mau tanya suku cadang untuk ${machine.name}. Saya kirim fotonya.`)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--text)] underline underline-offset-4"
            >
              Kirim fotonya lewat WhatsApp
            </a>
          </p>
        </div>

        <ul className="grid border-t border-[var(--line)] small:col-span-8 medium:grid-cols-2 medium:gap-x-10">
          {rows.map(({ part, product }) => {
            const { cheapestPrice } = getProductPrice({ product })
            const amounts = new Set(
              (product.variants ?? [])
                .map((v) => v.calculated_price?.calculated_amount)
                .filter((n) => n !== null && n !== undefined)
            )
            return (
              <li key={part.handle} className="border-b border-[var(--line)]">
                <LocalizedClientLink href={`/products/${part.handle}`} className="flex min-h-[80px] items-center gap-4 py-3">
                  <span className="wj-photo-slide relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-xl [isolation:isolate]">
                    {product.thumbnail && (
                      <Image src={product.thumbnail} alt="" fill sizes="58px" className="object-contain p-[8%] mix-blend-multiply" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-medium leading-snug text-[var(--text)]">{shortName(product.title)}</span>
                    <span className="mt-0.5 block text-[13px] text-[var(--text-3)]">
                      {part.qty} pcs per mesin
                      {part.note ? ` · ${part.note}` : ""}
                    </span>
                  </span>
                  {cheapestPrice && (
                    <span className="shrink-0 text-right leading-tight">
                      {amounts.size > 1 && <span className="block text-[12px] text-[var(--text-3)]">mulai</span>}
                      <span className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-[var(--text)]">
                        {cheapestPrice.calculated_price}
                      </span>
                    </span>
                  )}
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
