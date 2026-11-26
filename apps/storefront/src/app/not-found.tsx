import NotFoundScreen from "@/modules/layout/templates/not-found"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  description: "Halaman yang Anda tuju tidak ada.",
}

// an address that matches no route: outside the shop's layout, so the screen brings its logo
export default function NotFound() {
  return <NotFoundScreen standalone />
}
