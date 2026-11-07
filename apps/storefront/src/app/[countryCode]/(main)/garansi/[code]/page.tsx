import { Heading, Text } from "@medusajs/ui"
import type { Metadata } from "next"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

/*
  Landing page of the QR label on every WANGJIA unit. Works for people
  without the app: shows whether the serial is genuine and points to the app
  for warranty registration.
*/
export const metadata: Metadata = {
  title: "Cek Keaslian Produk WANGJIA",
  description: "Verifikasi nomor seri kincir air WANGJIA dan daftarkan garansi.",
  robots: { index: false },
}

type Verify = {
  genuine: boolean
  reason?: "invalid_code" | "unknown" | "void"
  unit?: {
    serial: string
    product_title: string
    variant_title: string | null
    warranty_months: number
    status: string
    registered: boolean
    warranty_expires_at: string | null
    scan_count: number
  }
}

const verify = async (code: string): Promise<Verify | null> => {
  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
  try {
    const res = await fetch(`${base}/store/warranty/verify/${encodeURIComponent(code)}`, {
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "" },
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as Verify
  } catch {
    return null
  }
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"

export default async function GaransiPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const result = await verify(code)

  return (
    <div className="content-container py-12 max-w-xl mx-auto flex flex-col gap-y-6">
      <Heading level="h1" className="text-2xl">Cek Keaslian Produk WANGJIA</Heading>

      {!result && (
        <Text className="text-ui-fg-subtle">Server verifikasi tidak dapat dihubungi. Coba lagi beberapa saat.</Text>
      )}

      {result && !result.genuine && (
        <div className="rounded-lg border border-ui-border-error bg-ui-bg-subtle p-5 flex flex-col gap-y-2">
          <Text className="text-ui-fg-error font-semibold text-lg">✕ Tidak terverifikasi</Text>
          <Text>
            {result.reason === "void"
              ? "Label ini sudah dibatalkan oleh WANGJIA. Unit ini mungkin bukan produk resmi."
              : "Kode ini tidak ada dalam database WANGJIA. Hati-hati, unit ini mungkin produk tiruan."}
          </Text>
          <Text className="text-ui-fg-subtle txt-small">
            Beli hanya dari PT Adhinusa Lestari Jaya atau dealer resmi. Laporkan produk tiruan lewat WhatsApp kami.
          </Text>
        </div>
      )}

      {result?.genuine && result.unit && (
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5 flex flex-col gap-y-3">
          <Text className="text-ui-fg-base font-semibold text-lg">✓ Produk WANGJIA asli</Text>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 txt-small">
            <dt className="text-ui-fg-subtle">Produk</dt>
            <dd>{[result.unit.product_title, result.unit.variant_title].filter(Boolean).join(" · ")}</dd>
            <dt className="text-ui-fg-subtle">Nomor seri</dt>
            <dd className="font-mono">{result.unit.serial}</dd>
            <dt className="text-ui-fg-subtle">Garansi</dt>
            <dd>
              {result.unit.registered
                ? `Terdaftar, berlaku sampai ${fmt(result.unit.warranty_expires_at)}`
                : `${result.unit.warranty_months} bulan, belum didaftarkan`}
            </dd>
          </dl>
          {result.unit.scan_count > 5 && (
            <Text className="text-ui-fg-error txt-small">
              Label ini sudah dipindai {result.unit.scan_count} kali. Jika Anda baru membeli unit ini, pastikan segel dan nomor seri di mesin sama.
            </Text>
          )}
          {!result.unit.registered && (
            <Text className="txt-small">
              Daftarkan garansi di aplikasi WANGJIA: buka menu Akun → Garansi & Keaslian → Scan QR. Anda akan menerima bukti garansi lewat WhatsApp.
            </Text>
          )}
        </div>
      )}

      <LocalizedClientLink href="/" className="text-ui-fg-interactive underline txt-small">
        Kembali ke beranda
      </LocalizedClientLink>
    </div>
  )
}
