import { t, useLang } from "../utils/i18n";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { sdk } from "../lib/client";

type Unit = {
  id: string;
  serial: string;
  product_title: string;
  variant_title: string | null;
  status: "in_stock" | "sold" | "registered" | "void";
  registered_name: string | null;
  warranty_expires_at: string | null;
};

/*
  Which physical machines left the warehouse for this order. Warehouse scans
  the QR (a barcode scanner types the URL + Enter) or types the serial while
  packing; the customer then sees the units in the app and registers the
  warranty with one tap.
*/
const OrderWarrantyUnitsWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  useLang();
  const qc = useQueryClient();
  const [serial, setSerial] = useState("");
  const key = ["order-warranty-units", order.id];
  const q = useQuery({
    queryKey: key,
    queryFn: () => sdk.client.fetch<{ units: Unit[] }>(`/admin/orders/${order.id}/warranty-units`),
  });
  const link = useMutation({
    mutationFn: (s: string) =>
      sdk.client.fetch(`/admin/orders/${order.id}/warranty-units`, { method: "POST", body: { serial: s } }),
    onSuccess: () => {
      setSerial("");
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["warranty", "units"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const unlink = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/orders/${order.id}/warranty-units/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  const ordered = (order.items ?? []).reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const units = q.data?.units ?? [];

  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">{t("机身序列号")}</Heading>
        <Badge size="2xsmall" color={units.length >= ordered && ordered > 0 ? "green" : "grey"}>
          {units.length} / {ordered}
        </Badge>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        {t("装箱时扫二维码或输入序列号，客户在 App 里就能看到这台机器并一键登记保修。")}
      </Text>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (serial.trim()) link.mutate(serial.trim());
        }}
      >
        <Input size="small" placeholder="WJ-26-000123" value={serial} onChange={(e) => setSerial(e.target.value)} autoFocus={false} />
        <Button size="small" type="submit" isLoading={link.isPending} disabled={!serial.trim()}>
          {t("添加")}
        </Button>
      </form>
      {units.length === 0 && <Text size="small" className="text-ui-fg-subtle">{t("还没有关联序列号。")}</Text>}
      {units.map((u) => (
        <div key={u.id} className="flex items-center justify-between gap-2 txt-small">
          <div className="flex flex-col">
            <span className="font-mono">{u.serial}</span>
            <span className="text-ui-fg-subtle">
              {[u.product_title, u.variant_title].filter(Boolean).join(" · ")}
              {u.status === "registered" && ` · ${t("已登记保修")}${u.registered_name ? `（${u.registered_name}）` : ""}`}
            </span>
          </div>
          {u.status !== "registered" && (
            <Button size="small" variant="transparent" onClick={() => unlink.mutate(u.id)}>{t("移除")}</Button>
          )}
        </div>
      ))}
      <Link to="/warranty" className="txt-small text-ui-fg-interactive underline">{t("打开防伪保修页")}</Link>
    </Container>
  );
};

export const config = defineWidgetConfig({ zone: "order.details.side.after" });

export default OrderWarrantyUnitsWidget;
