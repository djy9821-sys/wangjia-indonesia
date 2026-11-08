"use client"

import { StatusBadge } from "@medusajs/ui"

const StatusTitles: Record<string, string> = {
  accepted: "Diterima",
  customer_rejected: "Anda tolak",
  merchant_rejected: "Ditolak penjual",
  pending_merchant: "Menunggu tim sales",
  pending_customer: "Menunggu persetujuan Anda",
}

const StatusColors: Record<string, "green" | "orange" | "red" | "blue"> = {
  accepted: "green",
  customer_rejected: "red",
  merchant_rejected: "red",
  pending_merchant: "orange",
  pending_customer: "orange",
}

export default function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge color={StatusColors[status]}>
      {StatusTitles[status]}
    </StatusBadge>
  )
}
