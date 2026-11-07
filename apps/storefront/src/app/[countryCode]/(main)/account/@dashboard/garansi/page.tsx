import { listMyWarrantyUnits } from "@/lib/data/warranty"
import WarrantyRegisterForm from "@/modules/account/components/warranty-register-form"
import { Badge, Heading, Table, Text } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Garansi",
  description: "Mesin WANGJIA yang terdaftar atas nama Anda.",
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"

const isExpired = (iso: string | null) => (iso ? new Date(iso).getTime() < Date.now() : false)

export default async function GaransiPage() {
  const units = await listMyWarrantyUnits()
  return (
    <div className="w-full flex flex-col gap-y-8" data-testid="warranty-page-wrapper">
      <div>
        <Heading>Garansi & Keaslian</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Setiap kincir WANGJIA punya label QR. Pindai dengan kamera HP atau ketik kodenya di sini untuk
          mengaktifkan garansi. Di aplikasi WANGJIA Anda juga bisa mendaftar langsung dari pesanan.
        </Text>
      </div>
      <WarrantyRegisterForm />
      <div>
        <Heading level="h2" className="text-neutral-700 mb-4">Mesin saya</Heading>
        {units.length === 0 ? (
          <Text className="text-ui-fg-subtle">Belum ada mesin terdaftar.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Nomor seri</Table.HeaderCell>
                <Table.HeaderCell>Produk</Table.HeaderCell>
                <Table.HeaderCell>Terdaftar</Table.HeaderCell>
                <Table.HeaderCell>Garansi s/d</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {units.map((u) => {
                const expired = isExpired(u.warranty_expires_at)
                return (
                  <Table.Row key={u.id}>
                    <Table.Cell className="font-mono">{u.serial}</Table.Cell>
                    <Table.Cell>{[u.product_title, u.variant_title].filter(Boolean).join(" · ")}</Table.Cell>
                    <Table.Cell>{fmt(u.registered_at)}</Table.Cell>
                    <Table.Cell>{fmt(u.warranty_expires_at)}</Table.Cell>
                    <Table.Cell><Badge color={expired ? "grey" : "green"}>{expired ? "Habis" : "Aktif"}</Badge></Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  )
}
