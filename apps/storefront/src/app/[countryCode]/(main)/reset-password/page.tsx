"use client"

import { Button, Heading, Input, Label, Text } from "@medusajs/ui"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { sdk } from "@/lib/config"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

/*
  Landing page of the password-reset email. Calls Medusa's
  POST /auth/customer/emailpass/update with the token from the link.
*/
const ResetForm = () => {
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (password.length < 8) return setError("Kata sandi minimal 8 karakter.")
    if (password !== confirm) return setError("Konfirmasi kata sandi tidak sama.")
    setError(null)
    setStatus("busy")
    try {
      await sdk.client.fetch("/auth/customer/emailpass/update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { email, password },
      })
      setStatus("done")
    } catch (e) {
      setStatus("error")
      setError("Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari aplikasi atau halaman masuk.")
    }
  }

  if (!token || !email) {
    return <Text className="text-ui-fg-subtle">Tautan reset tidak lengkap.</Text>
  }
  if (status === "done") {
    return (
      <div className="flex flex-col gap-y-3">
        <Text>Kata sandi berhasil diubah. Silakan masuk kembali di aplikasi atau di sini.</Text>
        <LocalizedClientLink href="/account">
          <Button>Masuk</Button>
        </LocalizedClientLink>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-y-4">
      <Text className="text-ui-fg-subtle">Akun: {email}</Text>
      <div className="flex flex-col gap-y-1">
        <Label>Kata sandi baru</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label>Ulangi kata sandi</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      {error && <Text className="text-ui-fg-error txt-small">{error}</Text>}
      <Button onClick={submit} isLoading={status === "busy"}>Simpan kata sandi</Button>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="content-container max-w-lg py-12 flex flex-col gap-y-6">
      <Heading level="h1" className="text-2xl">Atur ulang kata sandi</Heading>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  )
}
