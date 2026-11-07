"use client"

import { Heading } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="min-h-[75vh] w-full py-10 border-b border-ui-border-base relative bg-gradient-to-b from-sky-50 to-neutral-100">
      <div className="flex flex-col justify-center items-center text-center px-6 small:px-32 gap-6">
        <span>
          <p className="text-neutral-600 text-xs uppercase tracking-wide">
            Official store WANGJIA® Indonesia
          </p>

          <img
            src="/products/aerator-2hp.png"
            alt="Kincir air WANGJIA 2 HP"
            className="mx-auto w-full max-w-xl rounded-2xl mb-2"
          />
          <Heading
            level="h1"
            className="text-4xl small:text-6xl leading-tight text-ui-fg-base font-normal mt-4 mb-5"
          >
            Kincir Air WANGJIA 1 HP & 2 HP
          </Heading>

          <p className="leading-8 text-ui-fg-subtle font-normal text-lg max-w-2xl mx-auto">
            Aerator tambak udang & ikan: hemat listrik, oksigen merata, suku cadang
            selalu tersedia. Pesan langsung dari pabrik, bayar bertahap, kirim ke
            seluruh Indonesia. Garansi 1 tahun.
          </p>
        </span>
        <div className="flex gap-3">
          <LocalizedClientLink href="/store">
            <Button className="rounded-2xl">Lihat Produk</Button>
          </LocalizedClientLink>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" className="rounded-2xl">
              Chat WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Hero
