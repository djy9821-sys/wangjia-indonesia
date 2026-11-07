import { Metadata } from "next"

import { STORE_NAME } from "@/lib/util/site"
import { PolicyPage } from "@/modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: `Bagaimana ${STORE_NAME} mengumpulkan, memakai dan melindungi data pribadi Anda.`,
}

/*
  Draft aligned with UU PDP No. 27/2022. Have an Indonesian lawyer review the
  final wording before launch; keep the "Terakhir diperbarui" date current.
*/
export default function PrivacyPage() {
  return (
    <PolicyPage title="Kebijakan Privasi">
      <p><em>Terakhir diperbarui: 7 November 2026</em></p>
      <p>
        Kebijakan ini menjelaskan bagaimana PT Adhinusa Lestari Jaya (&quot;WANGJIA&quot;, &quot;kami&quot;) memproses
        data pribadi pengguna situs web dan aplikasi WANGJIA sesuai Undang-Undang No. 27 Tahun 2022 tentang
        Pelindungan Data Pribadi.
      </p>
      <h3 className="font-semibold mt-2">Data yang kami kumpulkan</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Data akun: nama, nomor HP/WhatsApp, email, nama perusahaan, kata sandi (tersimpan terenkripsi).</li>
        <li>Data pesanan: alamat pengiriman, titik lokasi tambak di peta (jika Anda menandainya), produk, nilai transaksi, bukti transfer yang Anda unggah.</li>
        <li>Data garansi: nomor seri mesin, tanggal pendaftaran, lokasi tambak/kolam (opsional).</li>
        <li>Data perangkat: token notifikasi (push), versi aplikasi, laporan kesalahan teknis tanpa isi pesan pribadi.</li>
        <li>Cookie dan data penggunaan dasar untuk menjaga sesi masuk dan keranjang belanja, serta statistik kunjungan anonim.</li>
      </ul>
      <h3 className="font-semibold mt-2">Tujuan pemrosesan</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Memproses pesanan, rencana pembayaran, pengiriman, faktur dan garansi.</li>
        <li>Mengirim notifikasi transaksi lewat WhatsApp, email dan push (status pembayaran, pengiriman, garansi).</li>
        <li>Verifikasi keaslian produk dan pencegahan pemalsuan.</li>
        <li>Layanan purna jual dan pengingat servis/garansi.</li>
        <li>Pemenuhan kewajiban perpajakan dan pembukuan.</li>
      </ul>
      <h3 className="font-semibold mt-2">Pihak yang menerima data</h3>
      <p>
        Data dibagikan hanya sejauh diperlukan kepada penyedia layanan kami: penyedia pembayaran (Midtrans),
        layanan pesan (WhatsApp Business / Meta, penyedia email), ekspedisi dan layanan pelacakan kiriman,
        penyedia notifikasi push (Firebase), serta layanan pemantauan kesalahan teknis. Kami tidak menjual data pribadi.
      </p>
      <h3 className="font-semibold mt-2">Penyimpanan</h3>
      <p>
        Data akun disimpan selama akun aktif. Catatan pesanan, faktur dan garansi disimpan sesuai ketentuan
        perpajakan dan masa garansi (minimal 10 tahun untuk dokumen pembukuan). Bukti transfer disimpan secara privat
        dan hanya dapat diakses tim keuangan kami.
      </p>
      <h3 className="font-semibold mt-2">Hak Anda</h3>
      <ul className="list-disc pl-5 flex flex-col gap-y-2">
        <li>Mengakses dan memperbarui data lewat menu Akun di aplikasi atau situs.</li>
        <li>Menghapus akun kapan saja lewat Akun → Hapus akun di aplikasi: data kontak dihapus/dianonimkan, perangkat dan alamat dihapus, login dinonaktifkan. Catatan pesanan dan garansi tetap disimpan untuk kewajiban hukum.</li>
        <li>Menarik persetujuan notifikasi pemasaran dengan membalas &quot;STOP&quot; atau menghubungi kami.</li>
        <li>Mengajukan pertanyaan atau keluhan ke kontak di bawah; kami menjawab paling lambat 14 hari kerja.</li>
      </ul>
      <h3 className="font-semibold mt-2">Keamanan</h3>
      <p>
        Koneksi terenkripsi (HTTPS), kata sandi di-hash, akses internal dibatasi berdasarkan peran, dan data
        pembayaran kartu/VA ditangani langsung oleh penyedia pembayaran tanpa disimpan oleh kami.
      </p>
      <h3 className="font-semibold mt-2">Anak-anak</h3>
      <p>Layanan ditujukan untuk pelaku usaha dan orang dewasa; kami tidak dengan sengaja mengumpulkan data anak di bawah 18 tahun.</p>
      <h3 className="font-semibold mt-2">Kontak</h3>
      <p>
        PT Adhinusa Lestari Jaya, Jakarta, Indonesia. Hubungi kami lewat tombol WhatsApp di aplikasi atau email yang
        tercantum di halaman Kontak. Perubahan kebijakan akan diumumkan di halaman ini.
      </p>
    </PolicyPage>
  )
}
