import type { Shipment } from "@/lib/data/order-extras"
import { Heading, Text } from "@medusajs/ui"

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""

/* Carrier numbers and (when Biteship is configured) the delivery history. */
const OrderTracking = ({ shipments }: { shipments: Shipment[] }) => {
  if (!shipments.length) return null
  return (
    <div className="flex flex-col gap-y-3">
      <Heading level="h2" className="text-xl">Pengiriman</Heading>
      {shipments.map((s) => (
        <div key={s.id} className="flex flex-col gap-y-1 txt-small">
          <Text weight="plus">
            {s.delivered_at ? "Terkirim" : s.shipped_at ? "Dalam pengiriman" : "Disiapkan"}
            {s.shipping_option ? ` · ${s.shipping_option}` : ""}
          </Text>
          {s.labels.length === 0 && <Text className="text-ui-fg-subtle">Nomor resi belum ada.</Text>}
          {s.labels.map((l) => (
            <div key={l.tracking_number} className="flex flex-col gap-y-1">
              <Text>
                {(l.courier ?? "").toUpperCase()} {l.tracking_number}
                {l.status ? ` · ${l.status}` : ""}
                {l.tracking_url && (
                  <>
                    {" · "}
                    <a href={l.tracking_url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive underline">Lacak di ekspedisi</a>
                  </>
                )}
              </Text>
              {l.history.length > 0 && (
                <ul className="pl-4 border-l border-ui-border-base flex flex-col gap-y-1">
                  {[...l.history].reverse().map((h, i) => (
                    <li key={i}>
                      <span>{h.note ?? h.status}</span>
                      <span className="text-ui-fg-muted"> · {fmt(h.time)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default OrderTracking
