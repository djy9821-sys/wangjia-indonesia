import { getBaseURL } from "@/lib/util/env"
import { IS_PREVIEW } from "@/lib/util/preview"
import { Toaster } from "@medusajs/ui"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Metadata } from "next"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  // the browse-only copy is for people with the link, not for search engines
  ...(IS_PREVIEW ? { robots: { index: false, follow: false } } : {}),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  // the shop is in Indonesian: "en" made Chrome offer to translate every page
  return (
    <html lang="id" data-mode="light" className={GeistSans.variable}>
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      {/* An explicit page colour: a browser in dark mode would otherwise put the sections without
          their own background on a dark canvas. Paper, the surface of every page that is not in
          the night (the night pages darken the body themselves, styles/globals.css). */}
      <body className="bg-[#f6f4ef]">
        <main className="relative">{props.children}</main>
        <Toaster className="z-[99999]" position="bottom-left" />
        {/* Vercel's analytics script exists only on Vercel; elsewhere every page asked for it in vain */}
        {process.env.NEXT_PUBLIC_VERCEL_ENV && <Analytics />}
      </body>
    </html>
  )
}
