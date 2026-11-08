import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Users } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Input, Select, Table, Text, Textarea, Toaster, toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { sdk } from "../../lib/client";
import { formatDate } from "../../utils/payment-plan";

/*
  拼团 / Patungan: staff open a group price on one variant with a minimum
  quantity and a deadline; customers join from the storefront/app and their
  orders count toward the minimum. Success and failure are settled
  automatically (order.placed subscriber + hourly job) and notified.
*/
type GroupBuy = {
  id: string;
  title: string;
  product_title: string;
  product_handle: string | null;
  variant_title: string | null;
  currency_code: string;
  group_price: number;
  regular_price: number | null;
  min_quantity: number;
  max_quantity: number | null;
  joined_quantity: number;
  participants: number;
  ends_at: string;
  status: "open" | "success" | "failed" | "cancelled";
  note: string | null;
  created_at: string;
};
type ListResponse = { group_buys: GroupBuy[] };
type DetailResponse = {
  group_buy: GroupBuy;
  orders: {
    id: string;
    order_id: string;
    display_id: number | null;
    order_status: string | null;
    total: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    quantity: number;
    status: "joined" | "cancelled";
    created_at: string;
  }[];
};
type ProductsResponse = {
  products: { id: string; title: string; variants: { id: string; title: string; prices?: { amount: number; currency_code: string }[] }[] }[];
};

const STATUS: Record<GroupBuy["status"], { label: string; color: "blue" | "green" | "red" | "grey" }> = {
  open: { label: "进行中 / Berjalan", color: "blue" },
  success: { label: "成团 / Berhasil", color: "green" },
  failed: { label: "未成团 / Gagal", color: "red" },
  cancelled: { label: "已取消 / Dibatalkan", color: "grey" },
};
const rp = (n: number | null | undefined) => (n == null ? "-" : `Rp ${Math.round(n).toLocaleString("id-ID")}`);
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const CreateForm = ({ onDone }: { onDone: () => void }) => {
  const { data } = useQuery({
    queryKey: ["group-buys", "products"],
    queryFn: () => sdk.client.fetch<ProductsResponse>("/admin/products", { query: { limit: 100, fields: "id,title,*variants,*variants.prices" } }),
  });
  const products = data?.products ?? [];
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [title, setTitle] = useState("");
  const [groupPrice, setGroupPrice] = useState("");
  const [minQty, setMinQty] = useState("5");
  const [maxQty, setMaxQty] = useState("");
  const [endsAt, setEndsAt] = useState(toLocalInput(new Date(Date.now() + 14 * 86400000)));
  const [note, setNote] = useState("");
  const product = products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  const regular = variant?.prices?.find((p) => p.currency_code === "idr")?.amount;

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/group-buys", {
        method: "POST",
        body: {
          title: title || `Patungan ${product?.title ?? ""} ${variant?.title ?? ""}`.trim(),
          variant_id: variantId,
          group_price: Number(groupPrice),
          min_quantity: Number(minQty),
          max_quantity: maxQty ? Number(maxQty) : null,
          ends_at: new Date(endsAt).toISOString(),
          note: note || null,
        },
      }),
    onSuccess: () => {
      toast.success("拼团已创建 / Patungan dibuat");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-3 p-6 border-t border-ui-border-base small:grid-cols-2">
      <div>
        <Text size="small" className="mb-1">商品 / Produk</Text>
        <Select value={productId} onValueChange={(v) => { setProductId(v); setVariantId(""); }}>
          <Select.Trigger><Select.Value placeholder="Pilih produk" /></Select.Trigger>
          <Select.Content>{products.map((p) => <Select.Item key={p.id} value={p.id}>{p.title}</Select.Item>)}</Select.Content>
        </Select>
      </div>
      <div>
        <Text size="small" className="mb-1">规格 / Varian</Text>
        <Select value={variantId} onValueChange={setVariantId} disabled={!product}>
          <Select.Trigger><Select.Value placeholder="Pilih varian" /></Select.Trigger>
          <Select.Content>{(product?.variants ?? []).map((v) => <Select.Item key={v.id} value={v.id}>{v.title}</Select.Item>)}</Select.Content>
        </Select>
        {regular != null && <Text size="xsmall" className="text-ui-fg-subtle mt-1">Harga normal: {rp(regular)}</Text>}
      </div>
      <div className="small:col-span-2">
        <Text size="small" className="mb-1">标题 / Judul</Text>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Patungan ${product?.title ?? ""} ${variant?.title ?? ""}`.trim()} />
      </div>
      <div>
        <Text size="small" className="mb-1">拼团价 / Harga patungan (Rp)</Text>
        <Input type="number" min={1} value={groupPrice} onChange={(e) => setGroupPrice(e.target.value)} />
      </div>
      <div>
        <Text size="small" className="mb-1">截止 / Batas waktu</Text>
        <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </div>
      <div>
        <Text size="small" className="mb-1">成团最低台数 / Unit minimum</Text>
        <Input type="number" min={2} value={minQty} onChange={(e) => setMinQty(e.target.value)} />
      </div>
      <div>
        <Text size="small" className="mb-1">最多台数（可空）/ Kuota maks.</Text>
        <Input type="number" min={2} value={maxQty} onChange={(e) => setMaxQty(e.target.value)} />
      </div>
      <div className="small:col-span-2">
        <Text size="small" className="mb-1">说明 / Catatan</Text>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Mis. ongkir ditanggung bersama per wilayah" />
      </div>
      <div className="small:col-span-2 flex gap-2 justify-end">
        <Button variant="secondary" onClick={onDone}>取消 / Batal</Button>
        <Button
          onClick={() => create.mutate()}
          isLoading={create.isPending}
          disabled={!variantId || !groupPrice || Number(minQty) < 2 || (regular != null && Number(groupPrice) >= regular)}
        >
          创建 / Buat
        </Button>
      </div>
    </div>
  );
};

const OrdersPanel = ({ id }: { id: string }) => {
  const { data } = useQuery({
    queryKey: ["group-buys", id],
    queryFn: () => sdk.client.fetch<DetailResponse>(`/admin/group-buys/${id}`),
  });
  const orders = data?.orders ?? [];
  if (!orders.length) return <Text size="small" className="text-ui-fg-subtle px-6 py-3">还没有人参团 / Belum ada peserta.</Text>;
  return (
    <Table className="bg-ui-bg-subtle">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>订单 / Pesanan</Table.HeaderCell>
          <Table.HeaderCell>客户 / Pelanggan</Table.HeaderCell>
          <Table.HeaderCell>台数 / Unit</Table.HeaderCell>
          <Table.HeaderCell>金额 / Total</Table.HeaderCell>
          <Table.HeaderCell>状态</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orders.map((o) => (
          <Table.Row key={o.id}>
            <Table.Cell>
              <Link className="underline" to={`/orders/${o.order_id}`}>#{o.display_id ?? o.order_id.slice(-6)}</Link>
            </Table.Cell>
            <Table.Cell>{o.customer_name || "-"}{o.customer_phone ? ` · ${o.customer_phone}` : ""}</Table.Cell>
            <Table.Cell>{o.quantity}</Table.Cell>
            <Table.Cell>{rp(o.total)}</Table.Cell>
            <Table.Cell>
              <Badge size="2xsmall" color={o.status === "joined" ? "green" : "grey"}>{o.status === "joined" ? "参团中" : "已取消"}</Badge>
              {o.order_status === "canceled" && <Badge size="2xsmall" color="red" className="ml-1">订单已取消</Badge>}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};

const GroupBuysPage = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"all" | GroupBuy["status"]>("all");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["group-buys", "list", status],
    queryFn: () => sdk.client.fetch<ListResponse>("/admin/group-buys", { query: { status } }),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/group-buys/${id}`, { method: "POST", body: { status: "cancelled" } }),
    onSuccess: () => {
      toast.success("已取消 / Dibatalkan");
      qc.invalidateQueries({ queryKey: ["group-buys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rows = data?.group_buys ?? [];

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 gap-3 flex-wrap">
          <div>
            <Heading className="font-sans font-medium h1-core">拼团 / Patungan</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              几个养殖户凑一批机器拿团购价；到截止日未凑够台数则不成团。/ Beberapa petambak patungan untuk harga grosir.
            </Text>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)} size="small">
              <Select.Trigger className="w-40"><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="all">全部 / Semua</Select.Item>
                {(Object.keys(STATUS) as GroupBuy["status"][]).map((s) => <Select.Item key={s} value={s}>{STATUS[s].label}</Select.Item>)}
              </Select.Content>
            </Select>
            <Button size="small" onClick={() => setCreating((v) => !v)}>{creating ? "收起" : "新建拼团 / Buat"}</Button>
          </div>
        </div>
        {creating && <CreateForm onDone={() => { setCreating(false); qc.invalidateQueries({ queryKey: ["group-buys"] }); }} />}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>拼团 / Patungan</Table.HeaderCell>
              <Table.HeaderCell>价格 / Harga</Table.HeaderCell>
              <Table.HeaderCell>进度 / Progres</Table.HeaderCell>
              <Table.HeaderCell>截止 / Batas</Table.HeaderCell>
              <Table.HeaderCell>状态</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading && <Table.Row><Table.Cell {...({ colSpan: 6 } as any)}>…</Table.Cell></Table.Row>}
            {!isLoading && !rows.length && (
              <Table.Row><Table.Cell {...({ colSpan: 6 } as any)} className="text-ui-fg-subtle">还没有拼团 / Belum ada patungan.</Table.Cell></Table.Row>
            )}
            {rows.map((g) => (
              <>
                <Table.Row key={g.id} className="cursor-pointer" onClick={() => setOpen(open === g.id ? null : g.id)}>
                  <Table.Cell>
                    <div className="font-medium">{g.title}</div>
                    <Text size="xsmall" className="text-ui-fg-subtle">{g.product_title}{g.variant_title ? ` · ${g.variant_title}` : ""}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div>{rp(g.group_price)}</div>
                    {g.regular_price != null && <Text size="xsmall" className="text-ui-fg-subtle line-through">{rp(g.regular_price)}</Text>}
                  </Table.Cell>
                  <Table.Cell>
                    <div>{g.joined_quantity} / {g.min_quantity} unit{g.max_quantity ? ` (maks ${g.max_quantity})` : ""}</div>
                    <Text size="xsmall" className="text-ui-fg-subtle">{g.participants} peserta</Text>
                  </Table.Cell>
                  <Table.Cell>{formatDate(g.ends_at)}</Table.Cell>
                  <Table.Cell><Badge size="2xsmall" color={STATUS[g.status].color}>{STATUS[g.status].label}</Badge></Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    {g.status === "open" && (
                      <Button size="small" variant="secondary" onClick={() => { if (confirm("取消这个拼团？/ Batalkan patungan ini?")) cancel.mutate(g.id); }}>
                        取消 / Batalkan
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
                {open === g.id && (
                  <Table.Row key={`${g.id}-orders`}>
                    <Table.Cell {...({ colSpan: 6 } as any)} className="p-0"><OrdersPanel id={g.id} /></Table.Cell>
                  </Table.Row>
                )}
              </>
            ))}
          </Table.Body>
        </Table>
      </Container>
      <Toaster />
    </>
  );
};

export const config = defineRouteConfig({ label: "拼团 / Patungan", icon: Users });
export default GroupBuysPage;
