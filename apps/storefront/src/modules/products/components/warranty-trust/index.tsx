import LocalizedClientLink from "@/modules/common/components/localized-client-link"

/* Under the buy box: why a buyer can trust this unit, said once and plainly. */
const POINTS = [
  "Setiap unit punya nomor seri dan label QR: scan untuk cek keaslian.",
  "Garansi resmi 12 bulan, aktif sekali ketuk dari pesanan di aplikasi WANGJIA.",
  "Suku cadang asli (impeller, gearbox, pelampung) tersedia; servis via WhatsApp.",
  "Bayar bertahap: uang muka, pelunasan sebelum kirim; konfirmasi oleh tim keuangan.",
]

const Check = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-[3px] h-4 w-4 shrink-0 text-[#c77d12]">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WarrantyTrust = () => (
  <div className="w-full rounded-2xl border border-[#e3dfd6] bg-white p-5">
    <p className="text-[15px] font-semibold text-[#121417]">Produk resmi WANGJIA, bergaransi</p>
    <ul className="mt-3 grid gap-2.5 text-[14px] leading-snug text-[#4a4f57]">
      {POINTS.map((p) => (
        <li key={p} className="flex gap-2.5">
          <Check />
          {p}
        </li>
      ))}
    </ul>
    <LocalizedClientLink href="/garansi" className="mt-4 inline-block text-[14px] font-semibold text-[#121417] underline underline-offset-4">
      Cek keaslian produk
    </LocalizedClientLink>
  </div>
)

export default WarrantyTrust
