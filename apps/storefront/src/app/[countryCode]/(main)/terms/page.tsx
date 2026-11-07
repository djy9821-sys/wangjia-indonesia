import { Metadata } from "next"

import { STORE_NAME } from "@/lib/util/site"
import { PolicyPage } from "@/modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Syarat pembelian, pembayaran, pengiriman dan garansi produk ${STORE_NAME}.`,
}

export default function TermsPage() {
  return (
    <PolicyPage title="Syarat & Ketentuan">
      <p><em>Terakhir diperbarui: 7 November 2026</em></p>
      <h3 className="font-semibold mt-2">1. Penjual</h3>
      <p>Produk dijual oleh PT Adhinusa Lestari Jaya, distributor resmi kincir air / aerator WANGJIA® di Indonesia.</p>
      <h3 className="font-semibold mt-2">2. Pesanan dan harga</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Harga dalam Rupiah dan sudah termasuk PPN 11% kecuali dinyatakan lain. Ongkos kirim kargo dikonfirmasi tim kami sesuai tujuan dan volume.</li>
        <li>Pesanan dianggap sah setelah rencana pembayaran dibuat dan uang muka dikonfirmasi tim keuangan.</li>
        <li>Penawaran (quotation) berlaku sesuai tanggal yang tertera; harga dapat berubah untuk pesanan baru.</li>
      </ul>
      <h3 className="font-semibold mt-2">3. Pembayaran bertahap</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Umumnya uang muka 30% saat pesan dan pelunasan 70% sebelum barang dikirim; ketentuan lain dapat disepakati tertulis.</li>
        <li>Pembayaran lewat Midtrans (QRIS, virtual account, e-wallet) atau transfer ke rekening perusahaan yang tercantum di faktur. Unggah bukti transfer di aplikasi; dana dianggap diterima setelah dikonfirmasi tim keuangan.</li>
        <li>Pesanan yang uang mukanya tidak dibayar dalam batas waktu yang tertera dapat dibatalkan otomatis.</li>
        <li>Pengembalian dana untuk pesanan yang dibatalkan diproses ke rekening asal dalam 14 hari kerja setelah disetujui.</li>
      </ul>
      <h3 className="font-semibold mt-2">4. Pengiriman</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Barang dikirim setelah pembayaran sesuai rencana dikonfirmasi. Estimasi waktu dan ekspedisi diberitahukan saat pengiriman; nomor resi tersedia di aplikasi.</li>
        <li>Periksa kemasan dan kondisi unit saat diterima; laporkan kerusakan pengiriman dengan foto dalam 2×24 jam.</li>
        <li>Pengambilan di gudang Jakarta tersedia dengan perjanjian.</li>
      </ul>
      <h3 className="font-semibold mt-2">5. Garansi</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Setiap unit memiliki nomor seri dan label QR. Garansi berlaku setelah didaftarkan lewat aplikasi atau situs (atau maksimal 30 hari sejak pengiriman), selama masa yang tertera pada produk (umumnya 12 bulan).</li>
        <li>Garansi mencakup cacat material dan pengerjaan pada motor, gearbox dan rangka. Tidak termasuk keausan normal (impeller, seal, bearing), kerusakan akibat tegangan listrik tidak stabil, pemasangan atau pemakaian tidak sesuai petunjuk, bencana alam, atau modifikasi oleh pihak lain.</li>
        <li>Klaim diajukan lewat tombol &quot;Minta servis&quot; di aplikasi atau WhatsApp dengan menyebutkan nomor seri. Suku cadang asli tersedia melalui toko ini.</li>
        <li>Label yang dinyatakan tidak terverifikasi, rusak, atau dipindahkan ke unit lain membatalkan garansi.</li>
      </ul>
      <h3 className="font-semibold mt-2">6. Pengembalian</h3>
      <p>Lihat halaman Kebijakan Pengembalian. Produk industri yang telah dipasang/dipakai tidak dapat dikembalikan kecuali cacat produksi yang ditangani melalui garansi.</p>
      <h3 className="font-semibold mt-2">7. Akun</h3>
      <p>Anda bertanggung jawab atas kerahasiaan kata sandi dan aktivitas di akun Anda. Akun dapat dihapus kapan saja lewat aplikasi; kewajiban pembayaran yang belum selesai tetap berlaku.</p>
      <h3 className="font-semibold mt-2">8. Hukum yang berlaku</h3>
      <p>Syarat ini tunduk pada hukum Republik Indonesia. Perselisihan diselesaikan secara musyawarah; bila tidak tercapai, melalui pengadilan yang berwenang di Jakarta.</p>
    </PolicyPage>
  )
}
