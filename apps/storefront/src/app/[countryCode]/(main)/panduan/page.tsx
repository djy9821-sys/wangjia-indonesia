import { Metadata } from "next"

import { STORE_NAME } from "@/lib/util/site"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { PolicyPage } from "@/modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Panduan Pemasangan Kincir",
  description: `Cara merakit, memasang dan merawat kincir air WANGJIA 1 HP / 2 HP dari ${STORE_NAME}.`,
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"

const PARTS = [
  ["Pelampung HDPE", "2 pcs (1 HP) · 3 pcs (2 HP)", "pelampung-kincir-wangjia"],
  ["Rangka stainless", "1 pcs", "rangka-kincir-wangjia"],
  ["Gearbox bevel gear 1:14", "1 pcs", "gearbox-kincir-wangjia"],
  ["Dinamo motor", "1 pcs", "dinamo-motor-kincir-wangjia"],
  ["Kopel (moveable joint)", "2 pcs", "kopel-kincir-wangjia"],
  ["Pillow block (dudukan AS)", "2 pcs", "pillow-block-kincir-wangjia"],
  ["Poros (AS) stainless", "2 pcs", "as-kincir-wangjia"],
  ["Impeller", "2 pcs (1 HP) · 4 pcs (2 HP)", "impeller-kincir-wangjia"],
  ["Penutup motor", "1 pcs", "penutup-motor-kincir-wangjia"],
  ["Baut & mur + kunci pas 14", "1 set", null],
] as const

const STEPS = [
  "Letakkan 2 pelampung (3 untuk 2 HP) sejajar di darat, perhatikan tanda panah di ujung pelampung.",
  "Pasang rangka stainless di atas pelampung, kencangkan baut dan mur (pakai ring).",
  "Letakkan gearbox di tengah rangka lalu baut dan mur.",
  "Pasang 2 kopel di kedua sisi gearbox dan 2 pillow block di ujung rangka.",
  "Masukkan poros stainless lewat lubang pillow block sampai masuk ke kopel; kencangkan baut pengunci kopel.",
  "Pasang motor di atas gearbox. Jangan lupa packing (karet hijau) di antara motor dan gearbox, lalu baut dan mur.",
  "Buka tutup oli oranye di gearbox dan isi oli gigi SAE-90 (Pertamina Rored) sebanyak 700 ml, lalu tutup kembali. Baut pembuangan oli ada di bawah gearbox.",
  "Pasang impeller kiri dan kanan. Arah putaran searah jarum jam (lihat panah di gearbox); daun kipas harus menyerok air, jangan terbalik.",
  "Pasang penutup motor, sambungkan kabel ke listrik PLN sesuai tipe motor: 1 phase 220 V atau 3 phase 380 V.",
  "Turunkan kincir ke kolam, ikat ke patok dengan tali di kedua ujung pelampung, lalu nyalakan.",
]

export default function PanduanPage() {
  return (
    <PolicyPage title="Panduan Pemasangan & Perawatan Kincir">
      <p>
        Kincir air WANGJIA dikirim terurai (9 koli untuk 1 HP, 12 koli untuk 2 HP) dan dirakit sendiri
        di lokasi dengan kunci pas 14. Urutan di bawah berlaku untuk model 1 HP dan 2 HP.
      </p>

      <h2 className="text-lg-semi">Isi paket</h2>
      <table className="w-full text-sm">
        <tbody>
          {PARTS.map(([name, qty, handle]) => (
            <tr key={name} className="border-b border-ui-border-base">
              <td className="py-2">
                {handle ? (
                  <LocalizedClientLink className="underline" href={`/products/${handle}`}>
                    {name}
                  </LocalizedClientLink>
                ) : (
                  name
                )}
              </td>
              <td className="py-2 text-ui-fg-subtle text-right">{qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg-semi">Langkah perakitan</h2>
      <ol className="list-decimal pl-5 flex flex-col gap-y-2">
        {STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      <h2 className="text-lg-semi">Perawatan rutin</h2>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>
          <strong>Oli gearbox:</strong> ganti setelah 300 jam pertama, selanjutnya setiap ±3.600 jam
          (sekitar 5 bulan pemakaian nonstop). Lakukan di darat agar oli tidak tumpah ke kolam.
        </li>
        <li>
          <strong>Listrik:</strong> pastikan tegangan stabil; tegangan naik-turun memperpendek umur motor.
        </li>
        <li>
          <strong>Setiap panen:</strong> bersihkan pasir dan lumut di impeller dan pelampung supaya kincir
          tetap mengapung rata dan tidak korosi.
        </li>
        <li>
          <strong>Tanda perlu servis:</strong> gearbox berbunyi kasar (ganti gear set), oli merembes (ganti
          mechanical seal), putaran goyang (cek pillow block dan kopel).
        </li>
      </ul>

      <p>
        Ada kendala saat pemasangan?{" "}
        <a
          className="underline"
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Halo WANGJIA, saya butuh bantuan pemasangan kincir.")}`}
          target="_blank"
          rel="noreferrer"
        >
          Chat teknisi kami di WhatsApp
        </a>
        .
      </p>
    </PolicyPage>
  )
}
