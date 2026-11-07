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
      <div className="flex items-center text-neutral-50 justify-center small:p-3 p-2 text-center bg-neutral-900 text-sm">
        Official store WANGJIA® · Kincir air 1 HP & 2 HP · Pembayaran bertahap ·
        Pengiriman ke seluruh Indonesia · Garansi 1 tahun
      </div>

      <SessionCartMismatchBanner />

      {props.children}

      <Footer />

      <WhatsAppFab />
      <SessionFreeShippingNudge />
    </SessionProvider>
  )
}
