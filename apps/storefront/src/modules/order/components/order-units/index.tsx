"use client"

import { variantLabel } from "@/lib/util/variant-title"
import { registerOrderUnit, type OrderUnit } from "@/lib/data/order-extras"
import { Badge, Button, Heading, Text } from "@medusajs/ui"
import { useActionState } from "react"

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"

const RegisterButton = ({ unitId }: { unitId: string }) => {
  const [state, action, pending] = useActionState(registerOrderUnit, null)
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="unit_id" value={unitId} />
      <Button size="small" variant="secondary" type="submit" isLoading={pending}>Daftarkan garansi</Button>
      {state?.error && <Text className="text-ui-fg-error txt-small">{state.error}</Text>}
    </form>
  )
}

/* Machines the warehouse packed for this order; register the warranty here. */
const OrderUnits = ({ units }: { units: OrderUnit[] }) => {
  return (
    <div className="flex flex-col gap-y-3">
      <Heading level="h2" className="text-xl">Mesin dalam pesanan ini</Heading>
      {units.length === 0 ? (
        <Text className="text-ui-fg-subtle txt-small">Nomor seri akan muncul di sini setelah gudang mengirim pesanan Anda.</Text>
      ) : (
        <ul className="flex flex-col gap-y-2">
          {units.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 txt-small">
              <div className="flex flex-col">
                <span className="font-mono">{u.serial}</span>
                <span className="text-ui-fg-subtle">{[u.product_title, variantLabel(u.variant_title)].filter(Boolean).join(" · ")}</span>
              </div>
              {u.registered ? (
                <Badge color="green">{u.registered_to_me ? "Terdaftar atas nama Anda" : "Terdaftar"} · s/d {fmt(u.warranty_expires_at)}</Badge>
              ) : (
                <RegisterButton unitId={u.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrderUnits
