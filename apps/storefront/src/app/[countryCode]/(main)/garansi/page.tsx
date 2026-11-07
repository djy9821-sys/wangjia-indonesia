"use client"

import { Button, Heading, Input, Text } from "@medusajs/ui"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

/*
  Manual entry for people who cannot scan the QR: type the code printed under
  it and jump to the verification page.
*/
export default function GaransiIndexPage() {
  const router = useRouter()
  const { countryCode } = useParams<{ countryCode: string }>()
  const [code, setCode] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = code.trim().toUpperCase().match(/([A-Z2-9]{8,20})$/)
    if (m) router.push(`/${countryCode}/garansi/${m[1]}`)
  }

  return (
    <div className="content-container py-12 max-w-xl mx-auto flex flex-col gap-y-6">
      <Heading level="h1" className="text-2xl">Cek Keaslian Produk WANGJIA</Heading>
      <Text className="text-ui-fg-subtle">
        Setiap kincir air WANGJIA asli punya label QR dengan nomor seri (WJ-…) dan kode 12 karakter.
        Pindai QR dengan kamera HP, atau ketik kodenya di bawah.
      </Text>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Contoh: ABCD2345EFGH"
          autoCapitalize="characters"
          className="font-mono"
        />
        <Button type="submit" disabled={code.trim().length < 8}>Periksa</Button>
      </form>
      <Text className="txt-small text-ui-fg-subtle">
        Garansi diaktifkan lewat aplikasi WANGJIA (Akun → Garansi &amp; Keaslian). Produk tiruan? Laporkan ke kami lewat WhatsApp.
      </Text>
    </div>
  )
}
