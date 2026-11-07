import { t, useLang } from "../utils/i18n";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminCustomer, DetailWidgetProps } from "@medusajs/framework/types";
import { Badge, Container, Heading, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { sdk } from "../lib/client";
import { formatDate } from "../utils/payment-plan";

type Unit = {
  id: string;
  serial: string;
  product_title: string;
  variant_title: string | null;
  order_id: string | null;
  registered_at: string | null;
  warranty_expires_at: string | null;
  farm_location: string | null;
};

/* After-sales view: every machine this customer registered, with expiry. */
const CustomerWarrantyUnitsWidget = ({ data: customer }: DetailWidgetProps<AdminCustomer>) => {
  useLang();
  const q = useQuery({
    queryKey: ["warranty", "units", "customer", customer.id],
    queryFn: () =>
      sdk.client.fetch<{ units: Unit[] }>("/admin/warranty/units", {
        query: { customer_id: customer.id, limit: 100 },
      }),
  });
  const units = (q.data?.units ?? []).filter((u) => (u as Unit & { status?: string }).status !== "void");
  const now = Date.now();
  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">{t("客户的机器")}</Heading>
        <Badge size="2xsmall" color={units.length ? "green" : "grey"}>{units.length}</Badge>
      </div>
      {units.length === 0 && <Text size="small" className="text-ui-fg-subtle">{t("还没有登记保修的机器。")}</Text>}
      {units.map((u) => {
        const expired = u.warranty_expires_at ? new Date(u.warranty_expires_at).getTime() < now : false;
        return (
          <div key={u.id} className="flex flex-col txt-small">
            <div className="flex items-center gap-2">
              <span className="font-mono">{u.serial}</span>
              <Badge size="2xsmall" color={expired ? "grey" : "green"}>
                {expired ? t("保修已过期") : `${t("保修至")} ${formatDate(u.warranty_expires_at)}`}
              </Badge>
            </div>
            <span className="text-ui-fg-subtle">
              {[u.product_title, u.variant_title].filter(Boolean).join(" · ")}
              {u.farm_location ? ` · ${u.farm_location}` : ""}
              {u.order_id ? (
                <>
                  {" · "}
                  <Link to={`/orders/${u.order_id}`} className="text-ui-fg-interactive underline">{t("订单")}</Link>
                </>
              ) : null}
            </span>
          </div>
        );
      })}
    </Container>
  );
};

export const config = defineWidgetConfig({ zone: "customer.details.side.after" });

export default CustomerWarrantyUnitsWidget;
