import { Metadata } from "next"

// The lookup page is a client component and cannot name itself: without this the browser tab
// and a shared link showed the bare address.
export const metadata: Metadata = {
  title: "Cek Keaslian & Garansi",
  description:
    "Cek keaslian kincir air WANGJIA dengan kode QR atau nomor seri, dan lihat status garansinya.",
}

export default function GaransiLayout({ children }: { children: React.ReactNode }) {
  return children
}
