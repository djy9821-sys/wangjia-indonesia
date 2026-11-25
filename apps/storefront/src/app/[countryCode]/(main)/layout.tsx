import { SessionProvider } from "@/lib/context/session-context"
import { getRegion } from "@/lib/data/regions"
import { retrieveSession } from "@/lib/data/session"
import { getBaseURL } from "@/lib/util/env"
import {
  SessionCartMismatchBanner,
  SessionFreeShippingNudge,
} from "@/modules/layout/components/session-banners"
import Footer from "@/modules/layout/templates/footer"
import WhatsAppFab from "@/modules/layout/components/whatsapp-fab"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import { Metadata } from "next"
import { IS_PREVIEW } from "@/lib/util/preview"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const [session, region] = await Promise.all([
    retrieveSession(),
    getRegion(countryCode),
  ])

  return (
    <SessionProvider session={session}>
      <NavigationHeader currencyCode={region?.currency_code} />
      <div data-announce className="flex items-center text-neutral-50 justify-center small:p-3 p-2 text-center bg-neutral-900 text-[12.5px] small:text-sm">
        {IS_PREVIEW ? (
          <span>Versi pratinjau · 预览版：可以浏览，还不能下单</span>
        ) : (
          <>
            <span className="small:hidden">Toko resmi WANGJIA® · Bayar bertahap · Garansi 1 tahun</span>
            <span className="hidden small:inline">
              Toko resmi WANGJIA® · Kincir air 1 HP & 2 HP · Pembayaran bertahap ·
              Pengiriman ke seluruh Indonesia · Garansi 1 tahun
            </span>
          </>
        )}
      </div>

      <SessionCartMismatchBanner />

      {props.children}

      <Footer />

      <WhatsAppFab />
      <SessionFreeShippingNudge />
    </SessionProvider>
  )
}
