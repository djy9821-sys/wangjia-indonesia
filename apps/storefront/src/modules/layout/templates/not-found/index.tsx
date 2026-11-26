import { archivo } from "@/lib/fonts/archivo"
import { BASE_PATH } from "@/lib/util/preview"
import { whatsappLink } from "@/lib/util/whatsapp"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import "@/modules/store/templates/listing.css"
import Image from "next/image"

/*
  A missing page, in the night of the shop: what happened in plain words, then the two things
  that help (all products, a person on WhatsApp). The number is decoration behind the text.
  An address that matches no route at all is rendered outside the shop's layout, so that case
  (standalone) brings its own logo. Plain links with the country in them: this screen has no
  route parameters to read it from.
*/
const COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "id"
const to = (path: string) => `${BASE_PATH}/${COUNTRY}${path}`

export default function NotFoundScreen({ standalone = false }: { standalone?: boolean }) {
  return (
    <div data-wj-list className={`wj-list ${archivo.variable} ${standalone ? "min-h-screen" : ""}`}>
      {standalone && (
        <div className="content-container flex h-16 items-center">
          <a href={to("")} aria-label="WANGJIA, ke halaman depan">
            <Image src="/wangjia-logo-white.png" alt="WANGJIA" width={289} height={80} priority className="h-9 w-[130px] object-contain" />
          </a>
        </div>
      )}
      <div className="content-container relative flex min-h-[70vh] flex-col items-start justify-center overflow-hidden py-20">
        <p
          aria-hidden
          className="pointer-events-none absolute -right-[4vw] top-1/2 -translate-y-1/2 select-none font-[family-name:var(--font-archivo)] text-[52vw] font-[850] leading-none text-white/[0.05] [font-stretch:62%] small:text-[32vw]"
        >
          404
        </p>
        <p className="relative text-[12px] font-medium uppercase tracking-[0.12em] text-[#7f8aa0]">Halaman tidak ditemukan</p>
        <h1 className="relative mt-3 max-w-[14ch] font-[family-name:var(--font-archivo)] text-[48px] font-extrabold uppercase leading-[0.92] [font-stretch:72%] small:text-[76px]">
          Halaman ini tidak ada
        </h1>
        <p className="relative mt-5 max-w-[42ch] text-[17px] leading-relaxed text-[#a7b1c4]">
          Mungkin alamatnya salah ketik, atau produknya sudah dipindah. Semua kincir air dan suku cadang ada di halaman produk.
        </p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <a
            href={to("/store")}
            className="flex h-[52px] items-center rounded-full bg-[#ffb547] px-6 text-[16px] font-semibold text-[#1a1205] transition-transform duration-150 active:scale-[0.97]"
          >
            Lihat semua produk
          </a>
          <a
            href={whatsappLink("Halo WANGJIA, saya mencari sebuah halaman di toko dan tidak menemukannya.")}
            target="_blank"
            rel="noreferrer"
            className="flex h-[52px] items-center gap-2 rounded-full border border-[rgba(190,210,255,0.24)] px-6 text-[16px] font-semibold text-[#f2f4f7] transition-transform duration-150 active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px] text-[#25d366]" />
            Tanya lewat WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
