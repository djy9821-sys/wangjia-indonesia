"use client"

import { Badge, Button, Heading, Input, Label, Text, Textarea } from "@medusajs/ui"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createMidtransPayment,
  StoreInstallment,
  StorePaymentPlan,
  submitPaymentProof,
} from "@/lib/data/payment-plan"
import { convertToLocale } from "@/lib/util/money"

const STATUS: Record<StoreInstallment["status"], { label: string; color: "grey" | "orange" | "green" | "purple" | "red" }> = {
  unpaid: { label: "Belum dibayar", color: "grey" },
  awaiting_confirmation: { label: "Menunggu konfirmasi", color: "orange" },
  paid: { label: "Lunas", color: "green" },
  refunded: { label: "Dikembalikan", color: "purple" },
  cancelled: { label: "Dibatalkan", color: "red" },
}

// Deterministic (UTC, fixed month names) so server and client render the same text.
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const fmtDate = (d?: string | null) => {
  if (!d) return "-"
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return "-"
  return `${dt.getUTCDate()} ${MONTHS_ID[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`
}

const isOpen = (i: StoreInstallment) => i.status === "unpaid" || i.status === "awaiting_confirmation"

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const UploadProofForm = ({
  installment,
  currency,
  onDone,
}: {
  installment: StoreInstallment
  currency: string
  onDone: () => void
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [bank, setBank] = useState("")
  const [sender, setSender] = useState("")
  const [amount, setAmount] = useState(String(Math.round(installment.amount)))
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = () => {
    if (!file) return
    setError(null)
    start(async () => {
      try {
        const content = await fileToBase64(file)
        await submitPaymentProof(installment.id, {
          file: { name: file.name, mime_type: file.type || "image/jpeg", content },
          bank_name: bank || null,
          sender_name: sender || null,
          amount: Number(amount) || null,
          transferred_at: date ? new Date(date).toISOString() : null,
          note: note || null,
        })
        onDone()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-y-3 rounded-lg border border-ui-border-base p-4 bg-ui-bg-subtle">
      <Text className="txt-medium-plus">Upload bukti transfer</Text>
      <div className="grid gap-3 small:grid-cols-2">
        <div className="flex flex-col gap-y-1">
          <Label size="small">Foto / PDF bukti transfer</Label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="txt-small"
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">Bank pengirim</Label>
          <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="BCA / Mandiri / BNI / BRI" />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">Nama pengirim</Label>
          <Input value={sender} onChange={(e) => setSender(e.target.value)} />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">Jumlah transfer</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">Tanggal transfer</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-y-1 small:col-span-2">
          <Label size="small">Catatan</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {error && <Text className="text-ui-fg-error txt-small">{error}</Text>}
      <div className="flex gap-2">
        <Button size="small" onClick={submit} isLoading={pending} disabled={!file}>
          Kirim bukti transfer
        </Button>
        <Button size="small" variant="secondary" onClick={onDone}>Batal</Button>
      </div>
    </div>
  )
}

const InstallmentCard = ({
  installment,
  plan,
  orderId,
}: {
  installment: StoreInstallment
  plan: StorePaymentPlan
  orderId: string
}) => {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [paying, startPay] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const st = STATUS[installment.status]
  const currency = plan.currency_code
  const latestProof = installment.proofs?.[installment.proofs.length - 1]
  const open = isOpen(installment)
  // A backend that does not say is an older one, which always showed the button.
  const online = plan.payment_methods?.online !== false

  const payOnline = () => {
    setError(null)
    startPay(async () => {
      try {
        const finish = `${window.location.origin}${window.location.pathname}`
        const { redirect_url } = await createMidtransPayment(installment.id, finish)
        window.location.href = redirect_url
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-y-3 rounded-lg border border-ui-border-base p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-x-2">
          <Text className="txt-medium-plus">
            {installment.sequence}. {installment.label}
          </Text>
          <Badge size="2xsmall" color={st.color}>{st.label}</Badge>
        </div>
        <Text className="txt-medium-plus">
          {convertToLocale({ amount: Number(installment.amount), currency_code: currency })}
        </Text>
      </div>
      <div className="flex flex-wrap gap-x-4 txt-small text-ui-fg-subtle">
        {installment.due_date && <span>Jatuh tempo: {fmtDate(installment.due_date)}</span>}
        {installment.paid_at && <span>Dibayar: {fmtDate(installment.paid_at)}</span>}
        {!!installment.refunded_amount && installment.refunded_amount > 0 && (
          <span>Dikembalikan: {convertToLocale({ amount: Number(installment.refunded_amount), currency_code: currency })}</span>
        )}
      </div>
      {latestProof && installment.status !== "paid" && (
        <Text className={`txt-small ${latestProof.status === "rejected" ? "text-ui-fg-error" : "text-ui-fg-subtle"}`}>
          {latestProof.status === "pending" && "Bukti transfer sedang diperiksa tim keuangan."}
          {latestProof.status === "rejected" && `Bukti transfer ditolak${latestProof.review_note ? `: ${latestProof.review_note}` : ""}. Silakan unggah ulang.`}
          {latestProof.status === "accepted" && "Bukti transfer diterima."}
        </Text>
      )}
      {error && <Text className="text-ui-fg-error txt-small">{error}</Text>}
      {open && !uploading && (
        <div className="flex flex-wrap gap-2">
          {online && (
            <Button size="small" onClick={payOnline} isLoading={paying}>
              Bayar online (QRIS / VA / e-Wallet)
            </Button>
          )}
          <Button size="small" variant={online ? "secondary" : "primary"} onClick={() => setUploading(true)}>
            Upload bukti transfer
          </Button>
        </div>
      )}
      {open && uploading && (
        <UploadProofForm
          installment={installment}
          currency={currency}
          onDone={() => {
            setUploading(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

const InvoiceButton = ({ url }: { url: string | null }) =>
  url ? (
    <a href={url} target="_blank" rel="noreferrer">
      <Button size="small" variant="secondary">Unduh Invoice (PDF)</Button>
    </a>
  ) : null

const PaymentPlan = ({ plan, orderId, invoiceUrl = null }: { plan: StorePaymentPlan | null; orderId: string; invoiceUrl?: string | null }) => {
  if (!plan) {
    return (
      <div className="flex flex-col gap-y-2">
        <Heading level="h2" className="text-xl-semi">Rencana Pembayaran</Heading>
        <Text className="text-ui-fg-subtle">
          Rencana pembayaran belum dibuat. Tim kami akan menghubungi Anda via WhatsApp.
        </Text>
      </div>
    )
  }
  const installments = [...plan.installments].sort((a, b) => a.sequence - b.sequence)
  const paid = installments
    .filter((i) => i.status === "paid" || i.status === "refunded")
    .reduce((s, i) => s + Number(i.amount) - Number(i.refunded_amount ?? 0), 0)
  const released = Boolean(plan.released_at)
  const account = plan.payment_methods?.bank_transfer

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading level="h2" className="text-xl-semi">Rencana Pembayaran</Heading>
        <div className="flex items-center gap-3">
          <Text className="txt-small text-ui-fg-subtle">
            {convertToLocale({ amount: paid, currency_code: plan.currency_code })} /{" "}
            {convertToLocale({ amount: Number(plan.total_amount), currency_code: plan.currency_code })}
          </Text>
          <InvoiceButton url={invoiceUrl} />
        </div>
      </div>
      <div className={`rounded-lg p-3 txt-small ${released ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-tag-orange-bg text-ui-tag-orange-text"}`}>
        {plan.status === "cancelled"
          ? "Rencana pembayaran dibatalkan."
          : released
            ? "Pembayaran dikonfirmasi, pesanan siap dikirim."
            : plan.release_policy === "full_paid"
              ? "Pesanan dikirim setelah seluruh pembayaran dikonfirmasi keuangan."
              : "Pesanan dikirim setelah uang muka dikonfirmasi keuangan."}
      </div>
      {plan.note && <Text className="txt-small text-ui-fg-subtle whitespace-pre-line">{plan.note}</Text>}
      {account && installments.some(isOpen) && (
        <div className="rounded-lg border border-ui-border-base p-3">
          <Text className="txt-small text-ui-fg-subtle">Bayar lewat transfer bank ke</Text>
          <Text className="txt-medium-plus">{account}</Text>
          <Text className="txt-small text-ui-fg-subtle">
            Setelah transfer, upload bukti transfer di bawah. Tim keuangan kami akan mengonfirmasi.
          </Text>
        </div>
      )}
      {installments.map((i) => (
        <InstallmentCard key={i.id} installment={i} plan={plan} orderId={orderId} />
      ))}
    </div>
  )
}

export default PaymentPlan
