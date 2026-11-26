import { listCategories } from "@/lib/data/categories"
import { archivo } from "@/lib/fonts/archivo"
import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import Image from "next/image"

/*
  The footer of every page, in the night like the header: the two frame whatever is between
  them, night pages and paper pages alike (dark-branded stores keep their chrome dark around
  light task pages). It opens with the one thing a buyer here does before buying, asking on
  WhatsApp, in the display face; then three short lists whose rows are 48 px tall. The
  starter's footer was a 980 px column of 20 px links with no way to reach anyone.
*/
const LABEL = "text-[12px] font-medium uppercase tracking-[0.12em] text-[#7f8aa0]"
const LINK =
  "flex min-h-[48px] items-center py-1.5 text-[15px] leading-snug text-[#a7b1c4] [@media(hover:hover)]:hover:text-[#f2f4f7]"

const HELP = [
  ["Cek keaslian & garansi", "/garansi"],
  ["Panduan pemasangan & perawatan", "/panduan"],
  ["Panduan tambak & kincir air", "/blog"],
  ["Patungan (pesan bersama)", "/patungan"],
  ["Hubungi kami", "/contact"],
] as const

const POLICIES = [
  ["Informasi pengiriman", "/shipping"],
  ["Kebijakan retur", "/returns"],
  ["Syarat & ketentuan", "/terms"],
  ["Kebijakan privasi", "/privacy"],
] as const

const List = ({ title, items, className }: { title: string; items: readonly (readonly [string, string])[]; className?: string }) => (
  <div className={className}>
    <p className={LABEL}>{title}</p>
    <ul className="mt-2">
      {items.map(([label, href]) => (
        <li key={href}>
          <LocalizedClientLink href={href} className={LINK}>
            {label}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  </div>
)

export default async function Footer() {
  const categories = (await listCategories().catch(() => []))
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const products: (readonly [string, string])[] = [
    ["Semua produk", "/store"],
    ...categories.map((c) => [c.name, `/categories/${c.handle}`] as const),
  ]

  return (
    <footer className={`w-full border-t border-[rgba(190,210,255,0.12)] bg-[#060b15] text-[#f2f4f7] ${archivo.variable}`}>
      <div className="content-container grid gap-12 py-14 small:grid-cols-12 small:py-20">
        <div className="small:col-span-5">
          <p className={LABEL}>Ada pertanyaan?</p>
          <p className="mt-3 font-[family-name:var(--font-archivo)] text-[46px] font-extrabold uppercase leading-[0.92] [font-stretch:72%] small:text-[64px]">
            Tanya dulu,
            <br />
            baru beli.
          </p>
          <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-[#a7b1c4]">
            Tim kami membalas lewat WhatsApp, Senin–Sabtu 08.00–17.00 WIB.
          </p>
          <a
            href={whatsappLink("Halo WANGJIA, saya mau tanya tentang kincir air.")}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-[52px] items-center gap-2 rounded-full bg-[#f2f4f7] px-6 text-[16px] font-semibold text-[#060b15] transition-transform duration-150 active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px] text-[#128c7e]" />
            Tanya lewat WhatsApp
          </a>
        </div>

        <nav aria-label="Tautan kaki halaman" className="grid grid-cols-2 gap-x-6 gap-y-8 small:col-span-7 small:grid-cols-3">
          {/* on phones the long help labels get the full width, under the two short lists */}
          <List title="Produk" items={products} />
          <List title="Bantuan" items={HELP} className="order-3 col-span-2 small:order-none small:col-span-1" />
          <List title="Kebijakan" items={POLICIES} />
        </nav>
      </div>

      <div className="border-t border-[rgba(190,210,255,0.12)]">
        <div className="content-container flex flex-col gap-4 py-6 small:flex-row small:items-center small:justify-between">
          <Image src="/wangjia-logo-white.png" alt="WANGJIA" width={289} height={80} className="h-8 w-[116px] object-contain" />
          <p className="text-[13px] text-[#7f8aa0]">
            © {new Date().getFullYear()} PT Adhinusa Lestari Jaya · <span translate="no">WANGJIA®</span> Kincir Air. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
