import { Metadata } from "next"

import { STORE_NAME } from "@/lib/util/site"
import { PolicyPage } from "@/modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: `Cara menghubungi ${STORE_NAME}: WhatsApp penjualan dan layanan purna jual kincir air.`,
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "halo@wangjia.co.id"

export default function ContactPage() {
  return (
    <PolicyPage title="Hubungi Kami">
      <p>
        Tim WANGJIA siap membantu memilih kincir air yang pas untuk tambak Anda, mengecek status pesanan,
        atau menangani klaim garansi. Cara tercepat adalah WhatsApp.
      </p>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>
          <strong>WhatsApp penjualan &amp; purna jual:</strong>{" "}
          <a
            className="underline"
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Halo WANGJIA, saya ingin bertanya tentang kincir air.")}`}
            target="_blank"
            rel="noreferrer"
          >
            +{WHATSAPP}
          </a>{" "}
          (Senin–Sabtu 08.00–17.00 WIB)
        </li>
        <li>
          <strong>Email:</strong>{" "}
          <a className="underline" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </li>
        <li>
          <strong>Pesanan &amp; garansi:</strong> sebutkan nomor pesanan atau nomor seri mesin (WJ-…) agar kami bisa
          langsung menindaklanjuti.
        </li>
        <li>
          <strong>Gudang Jakarta:</strong> pengambilan sendiri dan servis dijadwalkan lewat WhatsApp.
        </li>
      </ul>
    </PolicyPage>
  )
}
