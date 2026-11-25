import { getBaseURL } from "@/lib/util/env"
import { Toaster } from "@medusajs/ui"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Metadata } from "next"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  // the shop is in Indonesian: "en" made Chrome offer to translate every page
  return (
    <html lang="id" data-mode="light" className={GeistSans.variable}>
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      {/* An explicit white page: a browser in dark mode would otherwise put
          the sections without their own background on a dark canvas. */}
      <body className="bg-white">
        <main className="relative">{props.children}</main>
        <Toaster className="z-[99999]" position="bottom-left" />
        <Analytics />
      </body>
    </html>
  )
}
