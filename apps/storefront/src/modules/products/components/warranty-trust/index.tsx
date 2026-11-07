import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Text } from "@medusajs/ui"

/* Conversion block under the buy box: why a buyer can trust this unit. */
const WarrantyTrust = () => (
  <div className="rounded-lg border border-ui-border-base p-4 flex flex-col gap-y-2 txt-small">
    <Text weight="plus">Produk resmi WANGJIA, bergaransi</Text>
    <ul className="list-disc pl-4 text-ui-fg-subtle flex flex-col gap-y-1">
      <li>Setiap unit punya nomor seri dan label QR: scan untuk cek keaslian.</li>
      <li>Garansi resmi 12 bulan, aktif sekali ketuk dari pesanan di aplikasi WANGJIA.</li>
      <li>Suku cadang asli (impeller, gearbox, pelampung) tersedia; servis via WhatsApp.</li>
      <li>Bayar bertahap: uang muka, pelunasan sebelum kirim; konfirmasi oleh tim keuangan.</li>
    </ul>
    <LocalizedClientLink href="/garansi" className="text-ui-fg-interactive underline w-fit">
      Cek keaslian produk
    </LocalizedClientLink>
  </div>
)

export default WarrantyTrust
