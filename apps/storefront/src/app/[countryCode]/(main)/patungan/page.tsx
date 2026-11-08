import { listGroupBuys } from "@/lib/data/group-buys"
import { STORE_NAME } from "@/lib/util/site"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import GroupBuyCard from "@/modules/products/components/group-buy-offer/card"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Patungan Kincir Air",
  description: `Pesan kincir air WANGJIA bersama petambak lain dan dapatkan harga grosir di ${STORE_NAME}.`,
}

export default async function PatunganPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const groupBuys = await listGroupBuys().catch(() => [])
  return (
    <div className="content-container py-12 flex flex-col gap-8">
      <div className="max-w-3xl flex flex-col gap-4">
        <h1 className="text-2xl-semi">Patungan: pesan bersama, harga grosir</h1>
        <ol className="list-decimal pl-5 flex flex-col gap-2 text-ui-fg-base">
          <li>Pilih patungan yang sedang berjalan, tentukan jumlah unit, lalu selesaikan pesanan seperti biasa (bisa bayar bertahap).</li>
          <li>Pesanan Anda dihitung ke target unit minimum. Ajak petambak tetangga supaya cepat terpenuhi.</li>
          <li>Begitu unit minimum terpenuhi sebelum batas waktu, harga patungan berlaku dan kami kirim setelah pembayaran diterima.</li>
          <li>Kalau target tidak terpenuhi, tim kami menghubungi Anda: pembayaran dikembalikan penuh, atau pesanan lanjut dengan harga normal.</li>
        </ol>
        <p className="text-sm text-ui-fg-subtle">
          Punya kelompok sendiri dan ingin membuka patungan untuk tipe tertentu?{" "}
          <LocalizedClientLink href="/contact" className="underline">
            Hubungi kami
          </LocalizedClientLink>
          .
        </p>
      </div>
      {groupBuys.length ? (
        <div className="grid gap-4 small:grid-cols-2 medium:grid-cols-3">
          {groupBuys.map((g) => (
            <GroupBuyCard key={g.id} g={g} countryCode={countryCode} />
          ))}
        </div>
      ) : (
        <p className="text-ui-fg-subtle">Belum ada patungan yang berjalan saat ini. Cek lagi nanti atau hubungi kami lewat WhatsApp.</p>
      )}
    </div>
  )
}
