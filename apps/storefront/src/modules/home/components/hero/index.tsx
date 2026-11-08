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
            Toko resmi WANGJIA® Indonesia
          </p>

          <div className="mx-auto mt-4 mb-2 grid grid-cols-2 gap-3 max-w-xl">
            <img
              src="/products/kincir-1hp.jpg"
              alt="Kincir air WANGJIA 1 HP"
              className="w-full rounded-2xl bg-white shadow-sm"
            />
            <img
              src="/products/kincir-2hp.jpg"
              alt="Kincir air WANGJIA 2 HP"
              className="w-full rounded-2xl bg-white shadow-sm"
            />
          </div>
          <Heading
            level="h1"
            className="text-4xl small:text-6xl leading-tight text-ui-fg-base font-normal mt-4 mb-5"
          >
            Kincir Air WANGJIA 1 HP & 2 HP
          </Heading>

          <p className="leading-8 text-ui-fg-subtle font-normal text-lg max-w-2xl mx-auto">
            Aerator tambak udang & ikan: gearbox bevel gear mechanical seal hemat
            listrik 25 %, poros dan rangka stainless SS304, pelampung HDPE 175 cm.
            Suku cadang lengkap, bayar bertahap, kirim ke seluruh Indonesia. Garansi
            motor 1 tahun.
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
