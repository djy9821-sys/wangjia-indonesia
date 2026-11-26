import { archivo } from "@/lib/fonts/archivo"
import { whatsappLink } from "@/lib/util/whatsapp"

/*
  The reading pages (delivery, returns, terms, privacy, contact, the installation guide), on
  paper under the night header: the title in the shop's display face on the left, the text in
  a readable column on the right, the same 4 | 8 split as the sections of a product page.
*/
export const PolicyPage = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className={`bg-[#f6f4ef] text-[#121417] ${archivo.variable}`}>
    <div
      className="content-container grid gap-8 py-12 small:grid-cols-12 small:gap-12 small:py-20"
      data-testid="policy-page"
    >
      <div className="small:col-span-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
          <span translate="no">WANGJIA®</span> · Bantuan
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-archivo)] text-[44px] font-extrabold uppercase leading-[0.92] [font-stretch:72%] [text-wrap:balance] small:text-[60px]">
          {title}
        </h1>
      </div>
      <div className="flex max-w-[68ch] flex-col gap-5 text-[17px] leading-relaxed text-[#2b2f36] small:col-span-8 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-4 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:text-[#121417] [&_strong]:font-semibold [&_strong]:text-[#121417]">
        {children}
        {/* every reading page ends with a person to ask */}
        <p className="mt-2 border-t border-[#dedad0] pt-5 text-[16px] text-[#3d4350]">
          Masih ada yang belum jelas?{" "}
          <a
            href={whatsappLink(`Halo WANGJIA, saya punya pertanyaan tentang ${title.toLowerCase()}.`)}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#121417]"
          >
            Tanya lewat WhatsApp
          </a>
        </p>
      </div>
    </div>
  </div>
)
