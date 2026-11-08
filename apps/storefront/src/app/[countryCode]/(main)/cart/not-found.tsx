import InteractiveLink from "@/modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "Terjadi kesalahan",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Halaman tidak ditemukan</h1>
      <p className="text-small-regular text-ui-fg-base">
        Keranjang tidak ditemukan. Hapus cookie lalu coba lagi.
      </p>
      <InteractiveLink href="/">Ke halaman depan</InteractiveLink>
    </div>
  )
}
