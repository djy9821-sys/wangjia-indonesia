import { t, useLang } from "../../utils/i18n";
import { LangToggle } from "../../components/common/lang-toggle";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ShieldCheck } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Input, Select, Table, Text, Toaster, toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { sdk } from "../../lib/client";
import { formatDate } from "../../utils/payment-plan";

type Unit = {
  id: string;
  serial: string;
  code: string;
  qr_url: string;
  product_title: string;
  variant_title: string | null;
  batch: string | null;
  status: "in_stock" | "sold" | "registered" | "void";
  warranty_months: number;
  order_id: string | null;
  registered_name: string | null;
  registered_phone: string | null;
  registered_at: string | null;
  warranty_expires_at: string | null;
  farm_location: string | null;
  scan_count: number;
  created_at: string;
};
type ListResponse = { units: Unit[]; count: number; stats: { in_stock: number; registered: number } };
type ProductsResponse = { products: { id: string; title: string; variants: { id: string; title: string }[] }[] };

const STATUS_LABEL: Record<Unit["status"], string> = {
  in_stock: "在库",
  sold: "已发出",
  registered: "已登记保修",
  void: "已作废",
};
const STATUS_COLOR: Record<Unit["status"], "grey" | "blue" | "green" | "red"> = {
  in_stock: "grey",
  sold: "blue",
  registered: "green",
  void: "red",
};

const download = async (url: string, filename: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    toast.error(t("导出失败"));
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(await res.blob());
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

const GenerateForm = ({ onDone }: { onDone: () => void }) => {
  const products = useQuery({
    queryKey: ["warranty", "products"],
    queryFn: () =>
      sdk.client.fetch<ProductsResponse>("/admin/products", {
        query: { limit: 100, fields: "id,title,variants.id,variants.title" },
      }),
  });
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("20");
  const [batch, setBatch] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-A`;
  });
  const [months, setMonths] = useState("12");

  const generate = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ units: Unit[]; count: number }>("/admin/warranty/units", {
        method: "POST",
        body: {
          product_id: productId,
          variant_id: variantId || null,
          quantity: Number(quantity),
          batch: batch || null,
          warranty_months: Number(months),
        },
      }),
    onSuccess: async (data) => {
      toast.success(`${t("已生成")} ${data.count} ${t("个序列号")}`);
      onDone();
      await download(
        `/admin/warranty/units/export?ids=${data.units.map((u) => u.id).join(",")}`,
        `wangjia-serial-${batch || "batch"}.csv`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const product = products.data?.products.find((p) => p.id === productId);
  const variants = product?.variants ?? [];

  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <div>
        <Text size="small" weight="plus">{t("生成序列号与二维码标签")}</Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("出厂前按批次生成，下载 CSV 交给标签打印（每行一台：序列号、二维码内容）。二维码贴在机身铭牌旁，客户扫码即可验真并登记保修。")}
        </Text>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-y-1 min-w-56">
          <Text size="xsmall">{t("产品")}</Text>
          <Select value={productId} onValueChange={(v) => { setProductId(v); setVariantId(""); }}>
            <Select.Trigger><Select.Value placeholder={t("选择产品")} /></Select.Trigger>
            <Select.Content>
              {(products.data?.products ?? []).map((p) => (
                <Select.Item key={p.id} value={p.id}>{p.title}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1 min-w-40">
          <Text size="xsmall">{t("规格（可选）")}</Text>
          <Select value={variantId} onValueChange={setVariantId} disabled={!variants.length}>
            <Select.Trigger><Select.Value placeholder={t("全部规格")} /></Select.Trigger>
            <Select.Content>
              {variants.map((v) => (
                <Select.Item key={v.id} value={v.id}>{v.title}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1 w-24">
          <Text size="xsmall">{t("数量")}</Text>
          <Input type="number" min={1} max={500} size="small" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="flex flex-col gap-y-1 w-36">
          <Text size="xsmall">{t("批次号")}</Text>
          <Input size="small" value={batch} onChange={(e) => setBatch(e.target.value)} />
        </div>
        <div className="flex flex-col gap-y-1 w-28">
          <Text size="xsmall">{t("保修月数")}</Text>
          <Input type="number" min={1} max={60} size="small" value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
        <Button
          size="small"
          onClick={() => generate.mutate()}
          isLoading={generate.isPending}
          disabled={!productId || !Number(quantity)}
        >
          {t("生成并下载 CSV")}
        </Button>
      </div>
    </Container>
  );
};

const WarrantyPage = () => {
  useLang();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const list = useQuery({
    queryKey: ["warranty", "units", q, status, offset],
    queryFn: () =>
      sdk.client.fetch<ListResponse>("/admin/warranty/units", {
        query: { q: q || undefined, status: status || undefined, limit, offset },
      }),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["warranty", "units"] });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      sdk.client.fetch(`/admin/warranty/units/${id}`, { method: "POST", body }),
    onSuccess: () => { refresh(); toast.success(t("已更新")); },
    onError: (e: Error) => toast.error(e.message),
  });

  const voidUnit = (u: Unit) => {
    if (!window.confirm(`${t("作废序列号")} ${u.serial}? ${t("作废后扫码会显示“非正品/标签已失效”，不可恢复。")}`)) return;
    update.mutate({ id: u.id, body: { status: "void" } });
  };
  const attachOrder = (u: Unit) => {
    const orderId = window.prompt(t("关联订单 ID（在订单页地址栏 order_… ），留空清除"), u.order_id ?? "");
    if (orderId === null) return;
    update.mutate({ id: u.id, body: { order_id: orderId.trim() || null } });
  };

  const data = list.data;
  const batches = Array.from(new Set((data?.units ?? []).map((u) => u.batch).filter(Boolean))) as string[];

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
            <Heading level="h2">{t("防伪与保修 / Garansi")}</Heading>
            <LangToggle />
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            {t("每台增氧机一个序列号 + 二维码。客户在 App 里扫码：显示正品、登记保修、看保修到期；仿品或作废标签扫出来是“无法验证”。")}
          </Text>
          {data && (
            <div className="flex gap-2">
              <Badge color="grey">{t("在库")} {data.stats.in_stock}</Badge>
              <Badge color="green">{t("已登记保修")} {data.stats.registered}</Badge>
              <Badge color="blue">{t("共")} {data.count}</Badge>
            </div>
          )}
        </div>
        <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
          <Input
            size="small"
            className="w-72"
            placeholder={t("搜索序列号 / 二维码 / 电话 / 订单")}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOffset(0); }}
          />
          <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setOffset(0); }}>
            <Select.Trigger className="w-44"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="all">{t("全部状态")}</Select.Item>
              {(Object.keys(STATUS_LABEL) as Unit["status"][]).map((s) => (
                <Select.Item key={s} value={s}>{t(STATUS_LABEL[s])}</Select.Item>
              ))}
            </Select.Content>
          </Select>
          {batches.map((b) => (
            <Button key={b} size="small" variant="secondary" onClick={() => download(`/admin/warranty/units/export?batch=${encodeURIComponent(b)}`, `wangjia-serial-${b}.csv`)}>
              {t("下载批次")} {b}
            </Button>
          ))}
        </div>
        {list.isLoading && <Text className="px-6 pb-4">{t("加载中…")}</Text>}
        {list.error && <Text className="px-6 pb-4 text-ui-fg-error">{(list.error as Error).message}</Text>}
        {data && data.units.length === 0 && <Text className="px-6 pb-4 text-ui-fg-subtle">{t("还没有序列号，先在下方生成一批。")}</Text>}
        {data && data.units.length > 0 && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("序列号")}</Table.HeaderCell>
                <Table.HeaderCell>{t("产品")}</Table.HeaderCell>
                <Table.HeaderCell>{t("批次号")}</Table.HeaderCell>
                <Table.HeaderCell>{t("状态")}</Table.HeaderCell>
                <Table.HeaderCell>{t("登记客户")}</Table.HeaderCell>
                <Table.HeaderCell>{t("保修到期")}</Table.HeaderCell>
                <Table.HeaderCell>{t("订单")}</Table.HeaderCell>
                <Table.HeaderCell>{t("扫码次数")}</Table.HeaderCell>
                <Table.HeaderCell>{t("操作")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.units.map((u) => (
                <Table.Row key={u.id}>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span className="font-mono">{u.serial}</span>
                      <a href={u.qr_url} target="_blank" rel="noreferrer" className="txt-small text-ui-fg-interactive font-mono">{u.code}</a>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{[u.product_title, u.variant_title].filter(Boolean).join(" · ")}</Table.Cell>
                  <Table.Cell>{u.batch ?? "-"}</Table.Cell>
                  <Table.Cell><Badge size="2xsmall" color={STATUS_COLOR[u.status]}>{t(STATUS_LABEL[u.status])}</Badge></Table.Cell>
                  <Table.Cell>
                    {u.registered_name || u.registered_phone ? (
                      <div className="flex flex-col txt-small">
                        <span>{u.registered_name ?? "-"}</span>
                        <span className="text-ui-fg-subtle">{u.registered_phone ?? ""} · {formatDate(u.registered_at)}</span>
                        {u.farm_location && <span className="text-ui-fg-subtle">{u.farm_location}</span>}
                      </div>
                    ) : "-"}
                  </Table.Cell>
                  <Table.Cell>{u.warranty_expires_at ? formatDate(u.warranty_expires_at) : `${u.warranty_months} ${t("个月")}`}</Table.Cell>
                  <Table.Cell>
                    {u.order_id ? (
                      <Link to={`/orders/${u.order_id}`} className="text-ui-fg-interactive underline txt-small">{u.order_id.slice(0, 14)}…</Link>
                    ) : "-"}
                  </Table.Cell>
                  <Table.Cell>
                    <span className={u.scan_count > 5 ? "text-ui-fg-error" : ""}>{u.scan_count}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      {u.status !== "void" && (
                        <Button size="small" variant="secondary" onClick={() => attachOrder(u)}>{t("关联订单")}</Button>
                      )}
                      {u.status !== "void" && (
                        <Button size="small" variant="danger" onClick={() => voidUnit(u)}>{t("作废")}</Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        {data && data.count > limit && (
          <div className="flex items-center justify-end gap-2 px-6 py-3">
            <Button size="small" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>{t("上一页")}</Button>
            <Text size="small">{offset + 1}–{Math.min(offset + limit, data.count)} / {data.count}</Text>
            <Button size="small" variant="secondary" disabled={offset + limit >= data.count} onClick={() => setOffset(offset + limit)}>{t("下一页")}</Button>
          </div>
        )}
      </Container>
      <GenerateForm onDone={refresh} />
      <Toaster />
    </div>
  );
};

export const config = defineRouteConfig({
  label: "防伪保修 / Garansi",
  icon: ShieldCheck,
});

export default WarrantyPage;
