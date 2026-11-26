import NotFoundScreen from "@/modules/layout/templates/not-found"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  description: "Halaman yang Anda tuju tidak ada.",
}

export default function NotFound() {
  return <NotFoundScreen />
}
