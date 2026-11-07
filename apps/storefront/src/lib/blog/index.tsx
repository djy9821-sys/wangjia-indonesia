import type { ReactNode } from "react"

/*
  Editorial content for search traffic (Indonesian shrimp / fish farmers
  looking for aerator advice). Articles live in the repo: no CMS to run.
  Add an article by appending to ARTICLES; keep slugs stable (they are URLs).
*/
export type Article = {
  slug: string
  title: string
  description: string
  publishedAt: string // ISO date
  updatedAt?: string
  readingMinutes: number
  tags: string[]
  body: ReactNode
}

const P = ({ children }: { children: ReactNode }) => <p className="leading-7">{children}</p>
const H2 = ({ children }: { children: ReactNode }) => <h2 className="text-xl font-semibold mt-6">{children}</h2>
const UL = ({ children }: { children: ReactNode }) => <ul className="list-disc pl-5 flex flex-col gap-y-1">{children}</ul>

export const ARTICLES: Article[] = [
  {
    slug: "cara-memilih-kincir-air-tambak-udang",
    title: "Cara Memilih Kincir Air untuk Tambak Udang: 1 HP atau 2 HP?",
    description:
      "Panduan praktis memilih kincir air (paddle wheel aerator) untuk tambak udang vaname dan ikan: daya, jumlah impeller, kedalaman kolam, dan listrik yang dibutuhkan.",
    publishedAt: "2026-11-08",
    readingMinutes: 6,
    tags: ["kincir air", "aerator", "tambak udang"],
    body: (
      <>
        <P>
          Kincir air (paddle wheel aerator) adalah mesin paling penting di tambak intensif: ia menambah oksigen terlarut,
          mengaduk air supaya suhu dan salinitas merata, dan mendorong kotoran ke tengah kolam agar mudah disedot. Salah
          memilih daya atau jumlah unit berarti udang stres di malam hari saat oksigen turun.
        </P>
        <H2>1 HP vs 2 HP: bedanya di mana?</H2>
        <UL>
          <li><strong>1 HP (2 impeller)</strong>: cocok untuk kolam 1.000-2.500 m², kedalaman 1-1,2 m, padat tebar rendah-sedang. Konsumsi listrik lebih hemat, mudah dipindah.</li>
          <li><strong>2 HP (4 impeller)</strong>: untuk kolam 2.500-5.000 m², kedalaman 1,2-1,8 m, padat tebar tinggi (di atas 100 ekor/m²). Arus lebih kuat, jangkauan oksigen lebih luas.</li>
        </UL>
        <P>
          Aturan kasarnya: 1 HP kincir mampu mendukung sekitar 400-500 kg biomassa udang. Hitung target panen Anda, bagi
          dengan angka itu, lalu bulatkan ke atas.
        </P>
        <H2>Hal yang sering dilupakan</H2>
        <UL>
          <li><strong>Tegangan listrik</strong>: motor 2 HP butuh suplai stabil (3 fasa lebih baik). Tegangan drop di malam hari adalah penyebab utama motor terbakar.</li>
          <li><strong>Gearbox</strong>: pastikan oli diganti sesuai jadwal; gearbox yang kering mati dalam hitungan minggu.</li>
          <li><strong>Pelampung</strong>: pelampung HDPE tahan UV; pelampung murah retak setelah satu musim.</li>
          <li><strong>Suku cadang</strong>: pilih merek yang impeller, gearbox dan pelampungnya tersedia terpisah, supaya tidak perlu ganti satu unit.</li>
        </UL>
        <H2>Rekomendasi WANGJIA</H2>
        <P>
          WANGJIA menyediakan kincir 1 HP dan 2 HP dengan suku cadang asli yang bisa dibeli satuan, garansi resmi 12
          bulan, dan nomor seri + QR di setiap unit untuk cek keaslian. Tidak yakin tipe mana? Kirim ukuran kolam dan
          target panen Anda lewat WhatsApp, tim kami bantu hitung.
        </P>
      </>
    ),
  },
  {
    slug: "berapa-kincir-air-per-hektar-tambak",
    title: "Berapa Kincir Air yang Dibutuhkan per Hektar Tambak?",
    description:
      "Rumus sederhana menghitung jumlah kincir air per hektar berdasarkan padat tebar dan target biomassa, lengkap dengan contoh untuk kolam 2.000 m² dan 1 hektar.",
    publishedAt: "2026-11-08",
    readingMinutes: 5,
    tags: ["kincir air", "perhitungan", "tambak"],
    body: (
      <>
        <P>
          Pertanyaan paling sering dari petambak baru: kolam saya seluas ini, butuh berapa kincir? Jawabannya tidak
          tergantung luas saja, tetapi pada <strong>biomassa</strong> (berat total udang di kolam saat panen).
        </P>
        <H2>Rumus cepat</H2>
        <P>
          Jumlah HP kincir = target biomassa (kg) ÷ 450. Contoh: kolam 2.000 m² dengan padat tebar 120 ekor/m² dan
          ukuran panen 20 g per ekor → 2.000 × 120 × 0,02 kg = 4.800 kg → 4.800 ÷ 450 ≈ 10,7 HP → gunakan 5 unit
          kincir 2 HP (atau 10 unit 1 HP).
        </P>
        <H2>Per hektar</H2>
        <UL>
          <li>Tradisional plus (padat tebar &lt; 50 ekor/m²): 6-10 HP per hektar.</li>
          <li>Semi intensif (50-100 ekor/m²): 15-25 HP per hektar.</li>
          <li>Intensif (100-200 ekor/m²): 30-50 HP per hektar, biasanya kombinasi kincir dan aerator bawah air.</li>
        </UL>
        <H2>Penempatan</H2>
        <P>
          Pasang kincir sehingga arus berputar satu arah mengelilingi kolam dan kotoran terkumpul di tengah (central
          drain). Jarak dari tanggul 3-5 m; jangan menghadap langsung ke tanggul karena mengikis tanah.
        </P>
        <P>
          Butuh gambar penempatan untuk kolam Anda? Kirim sketsa kolam ke WhatsApp WANGJIA, kami bantu rencanakan.
        </P>
      </>
    ),
  },
  {
    slug: "perawatan-kincir-air-impeller-gearbox-pelampung",
    title: "Perawatan Kincir Air agar Awet: Impeller, Gearbox, Pelampung, Motor",
    description:
      "Jadwal perawatan kincir air yang mudah diikuti: harian, mingguan, per siklus. Tanda-tanda gearbox dan motor bermasalah, serta kapan harus ganti impeller.",
    publishedAt: "2026-11-08",
    readingMinutes: 5,
    tags: ["perawatan", "suku cadang", "gearbox"],
    body: (
      <>
        <H2>Harian</H2>
        <UL>
          <li>Dengarkan suara: dengung kasar atau ketukan pada gearbox berarti bearing aus atau oli habis.</li>
          <li>Periksa arus air: cipratan yang mengecil tanda impeller patah atau tersangkut sampah.</li>
          <li>Cek kabel dan sambungan: terkelupas sedikit saja bisa bocor listrik ke air.</li>
        </UL>
        <H2>Mingguan</H2>
        <UL>
          <li>Bersihkan impeller dari lumut dan plastik.</li>
          <li>Periksa level oli gearbox; tambah bila di bawah garis.</li>
          <li>Kencangkan baut pelampung dan rangka.</li>
        </UL>
        <H2>Setiap siklus (3-4 bulan)</H2>
        <UL>
          <li>Ganti oli gearbox sepenuhnya.</li>
          <li>Cek seal poros motor; ganti bila ada rembesan.</li>
          <li>Ukur arus motor dengan tang ampere; arus naik berarti bearing atau gearbox berat.</li>
        </UL>
        <H2>Kapan ganti suku cadang</H2>
        <P>
          Impeller retak atau sirip patah → ganti segera, karena getaran merusak gearbox. Pelampung retak → ganti sebelum
          tenggelam dan merendam motor. Semua suku cadang asli WANGJIA tersedia di aplikasi; mesin yang garansinya
          terdaftar mendapat pengingat servis otomatis 30 hari sebelum garansi habis.
        </P>
      </>
    ),
  },
  {
    slug: "cara-cek-keaslian-kincir-air-wangjia",
    title: "Cara Cek Keaslian Kincir Air WANGJIA dan Mengaktifkan Garansi",
    description:
      "Produk tiruan kincir air beredar dengan logo mirip. Begini cara memastikan unit WANGJIA Anda asli lewat label QR dan nomor seri, lalu mendaftarkan garansi 12 bulan.",
    publishedAt: "2026-11-08",
    readingMinutes: 3,
    tags: ["keaslian", "garansi", "QR"],
    body: (
      <>
        <P>
          Setiap kincir WANGJIA asli punya pelat nomor seri (format WJ-26-000123) dan stiker QR di dekat pelat nama.
          Produk tiruan biasanya tidak punya nomor seri, atau QR-nya mengarah ke halaman yang bukan milik WANGJIA.
        </P>
        <H2>Langkah cek</H2>
        <UL>
          <li>Pindai QR dengan kamera HP. Halaman WANGJIA menampilkan produk, nomor seri dan status garansi. Label yang tidak dikenal atau sudah dibatalkan ditandai “tidak terverifikasi”.</li>
          <li>Pastikan nomor seri di halaman sama dengan yang tercetak di mesin.</li>
          <li>Bila sebuah label sudah dipindai puluhan kali, kemungkinan label itu disalin ke banyak unit palsu; hubungi kami.</li>
        </UL>
        <H2>Aktifkan garansi</H2>
        <P>
          Di aplikasi WANGJIA, buka Akun → Garansi &amp; Keaslian → Scan QR, atau langsung dari pesanan Anda (nomor seri
          sudah tercatat saat gudang mengirim). Bukti garansi dikirim ke WhatsApp Anda, dan Anda akan diingatkan untuk
          servis sebelum masa garansi habis.
        </P>
      </>
    ),
  },
]

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug)
