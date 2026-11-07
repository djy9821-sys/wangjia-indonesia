import { Metadata } from "next"

import { STORE_NAME } from "@/lib/util/site"
import { PolicyPage } from "@/modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Kebijakan Pengembalian",
  description: `Ketentuan pengembalian dan servis produk ${STORE_NAME}.`,
}

export default function ReturnsPage() {
  return (
    <PolicyPage title="Kebijakan Pengembalian">
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li><strong>Salah kirim atau rusak saat pengiriman:</strong> laporkan dengan foto dalam 2×24 jam setelah diterima; kami ganti unit/komponen atau kembalikan dana penuh termasuk ongkos kirim.</li>
        <li><strong>Cacat produksi (DOA):</strong> unit yang tidak berfungsi saat pertama dipasang dalam 7 hari sejak diterima ditangani sebagai klaim garansi prioritas: perbaikan, penggantian komponen, atau penggantian unit.</li>
        <li><strong>Berubah pikiran:</strong> unit yang belum dibuka dari kemasan dapat dikembalikan dalam 7 hari dengan biaya kirim kembali ditanggung pembeli dan potongan biaya administrasi 5%. Unit yang sudah dipasang/dipakai tidak dapat dikembalikan.</li>
        <li><strong>Suku cadang:</strong> dapat ditukar bila salah tipe dan belum dipasang, dalam 7 hari.</li>
        <li><strong>Proses:</strong> ajukan lewat WhatsApp atau tombol &quot;Minta servis&quot; di aplikasi dengan nomor pesanan/nomor seri. Pengembalian dana diproses dalam 14 hari kerja setelah barang diterima dan diperiksa.</li>
      </ul>
    </PolicyPage>
  )
}
