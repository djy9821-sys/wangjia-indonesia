"use client"

import { joinGroupBuy } from "@/lib/data/group-buys"
import { Button } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

const JoinForm = ({
  id,
  countryCode,
  maxQuantity,
  compact,
}: {
  id: string
  countryCode: string
  maxQuantity: number | null
  compact?: boolean
}) => {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const max = maxQuantity ?? 99

  const submit = () =>
    start(async () => {
      setError(null)
      const res = await joinGroupBuy(id, qty, countryCode)
      if (res.ok) {
        router.push(`/${countryCode}/cart`)
        return
      }
      if (res.needsLogin) {
        router.push(`/${countryCode}/account`)
        return
      }
      setError(res.error)
    })

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-ui-border-base">
          <button type="button" className="px-3 py-1 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">
            −
          </button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button type="button" className="px-3 py-1 text-lg" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Tambah">
            +
          </button>
        </div>
        <Button className="rounded-full flex-1" size={compact ? "small" : "base"} onClick={submit} isLoading={pending} disabled={max < 1}>
          {max < 1 ? "Kuota habis" : "Ikut patungan"}
        </Button>
      </div>
      {error && <p className="text-xs text-ui-fg-error">{error}</p>}
    </div>
  )
}

export default JoinForm
