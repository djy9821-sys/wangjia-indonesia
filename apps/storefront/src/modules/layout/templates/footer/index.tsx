import { listCategories } from "@/lib/data/categories"
import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import Image from "next/image"

/*
  The footer of every page, on paper: where the night of the pages ends. What the shop is in
  one sentence, the WhatsApp line with its hours, then three short lists whose rows are tall
  enough for a thumb. The starter's footer was a 980 px column of 20 px links with no way to
  reach anyone.
*/
const LABEL = "text-[12px] font-medium uppercase tracking-[0.12em] text-[#6b7280]"
const LINK =
  "flex min-h-[44px] items-center py-1.5 text-[15px] leading-snug text-[#3d4350] [@media(hover:hover)]:hover:text-[#121417] [@media(hover:hover)]:hover:underline underline-offset-4"

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
    <footer className="w-full bg-[#f6f4ef] text-[#121417]">
      <div className="content-container grid gap-10 py-14 small:grid-cols-12 small:gap-12 small:py-20">
        <div className="small:col-span-5">
          <Image src="/wangjia-logo-horizontal.png" alt="WANGJIA" width={1444} height={400} className="h-9 w-[130px] object-contain" />
          <p className="mt-5 max-w-[30ch] text-[20px] font-medium leading-snug tracking-[-0.01em]">
            Kincir air untuk tambak udang dan ikan. Setiap suku cadang dijual satuan.
          </p>
          <a
            href={whatsappLink("Halo WANGJIA, saya mau tanya tentang kincir air.")}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-[52px] items-center gap-2 rounded-full bg-[#121417] px-6 text-[16px] font-semibold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px] text-[#25d366]" />
            Tanya lewat WhatsApp
          </a>
          <p className="mt-3 text-[14px] text-[#6b7280]">Dibalas Senin–Sabtu, 08.00–17.00 WIB</p>
        </div>

        <nav aria-label="Tautan kaki halaman" className="grid grid-cols-2 gap-x-6 gap-y-8 small:col-span-7 small:grid-cols-3">
          {/* on phones the long help labels get the full width, under the two short lists */}
          <List title="Produk" items={products} />
          <List title="Bantuan" items={HELP} className="order-3 col-span-2 small:order-none small:col-span-1" />
          <List title="Kebijakan" items={POLICIES} />
        </nav>
      </div>

      <div className="border-t border-[#dedad0]">
        <p className="content-container py-6 text-[13px] text-[#6b7280]">
          © {new Date().getFullYear()} PT Adhinusa Lestari Jaya · WANGJIA® Kincir Air. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  )
}
