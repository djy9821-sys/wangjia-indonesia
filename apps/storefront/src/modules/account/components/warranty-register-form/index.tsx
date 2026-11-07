"use client"

import { registerWarranty } from "@/lib/data/warranty"
import { Button, Input, Label, Text } from "@medusajs/ui"
import { useActionState } from "react"

const WarrantyRegisterForm = () => {
  const [state, action, pending] = useActionState(registerWarranty, null)
  return (
    <form action={action} className="flex flex-col gap-y-3 max-w-md">
      <div className="flex flex-col gap-y-1">
        <Label htmlFor="code">Kode di label QR</Label>
        <Input id="code" name="code" placeholder="ABCD2345EFGH" autoCapitalize="characters" required className="font-mono" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label htmlFor="farm_location">Lokasi tambak / kolam (opsional)</Label>
        <Input id="farm_location" name="farm_location" placeholder="Desa, Kecamatan" />
      </div>
      {state?.error && <Text className="text-ui-fg-error txt-small">{state.error}</Text>}
      {state?.ok && <Text className="text-ui-fg-interactive txt-small">Garansi aktif. Bukti dikirim ke WhatsApp / email Anda.</Text>}
      <Button type="submit" isLoading={pending} className="w-fit">Daftarkan garansi</Button>
    </form>
  )
}

export default WarrantyRegisterForm
