import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import WhatsAppIcon from "@/modules/common/icons/whatsapp"
import Image from "next/image"

/*
  Checkout keeps the shop's night bar but nothing that leads away from the order: the logo,
  the way back to the cart, and under the form the one thing a stuck buyer needs, a person on
  WhatsApp. The form itself sits on paper, like the cart.
*/
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-[#f6f4ef] small:min-h-screen">
      <div className="h-16 border-b border-[rgba(190,210,255,0.12)] bg-[#060b15] text-[#f2f4f7]">
        <nav className="content-container flex h-full items-center justify-between">
          <LocalizedClientLink href="/" aria-label="WANGJIA, ke halaman depan">
            <Image src="/wangjia-logo-white.png" alt="WANGJIA" width={289} height={80} priority className="h-9 w-[130px] object-contain" />
          </LocalizedClientLink>
          <LocalizedClientLink href="/cart" className="flex min-h-[44px] items-center text-[14px] text-[#a7b1c4] underline underline-offset-4">
            Kembali ke keranjang
          </LocalizedClientLink>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="content-container flex flex-col items-center gap-1 py-8 text-center text-[14px] text-[#6b7280]">
        <a
          href={whatsappLink("Halo WANGJIA, saya butuh bantuan saat checkout.")}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[44px] items-center gap-2 font-medium text-[#121417] underline underline-offset-4"
        >
          <WhatsAppIcon className="h-[18px] w-[18px] text-[#128c7e]" />
          Butuh bantuan? Tanya lewat WhatsApp
        </a>
        <p>Dibalas Senin–Sabtu, 08.00–17.00 WIB</p>
      </div>
    </div>
  )
}
