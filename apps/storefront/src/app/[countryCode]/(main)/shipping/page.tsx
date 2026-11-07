import { Metadata } from "next"

import { STORE_NAME } from "@/lib/util/site"
import { PolicyPage } from "@/modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Informasi Pengiriman",
  description: `Cara ${STORE_NAME} mengirim kincir air ke seluruh Indonesia.`,
}

export default function ShippingPage() {
  return (
    <PolicyPage title="Informasi Pengiriman">
      <p>
        Kincir air dikirim dari gudang kami di Jakarta dengan ekspedisi kargo (darat, laut, atau udara untuk suku
        cadang) ke seluruh Indonesia. Unit dikemas dalam peti/krat kayu dengan pelampung terpisah.
      </p>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li><strong>Biaya:</strong> ongkos kirim dihitung per tujuan dan volume, dikonfirmasi tim kami sebelum pelunasan dan tercantum di faktur.</li>
        <li><strong>Waktu:</strong> Jawa 2–5 hari kerja, Sumatera/Kalimantan/Sulawesi 5–10 hari kerja, Indonesia timur 10–20 hari kerja setelah pelunasan dikonfirmasi.</li>
        <li><strong>Lacak:</strong> nomor resi dan riwayat perjalanan tersedia di aplikasi (Pesanan → Lacak).</li>
        <li><strong>Titik lokasi:</strong> tandai tambak Anda di peta saat memesan agar sopir kargo mudah menemukan lokasi; untuk jalan yang tidak bisa dilalui truk, serah terima di titik terdekat yang disepakati.</li>
        <li><strong>Penerimaan:</strong> hitung jumlah koli dan periksa kondisi sebelum menandatangani tanda terima; laporkan kerusakan dengan foto dalam 2×24 jam.</li>
        <li><strong>Ambil sendiri:</strong> pengambilan di gudang Jakarta dapat dijadwalkan lewat WhatsApp.</li>
      </ul>
    </PolicyPage>
  )
}
