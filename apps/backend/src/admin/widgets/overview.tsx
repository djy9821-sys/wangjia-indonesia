import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { sdk } from "../lib/client";
import { formatMoney } from "../utils/payment-plan";
import { t, useLang } from "../utils/i18n";

type Overview = {
  awaiting_confirmation: { count: number; amount: number };
  overdue: { count: number; amount: number };
  to_ship: { count: number };
  quotes_pending: { count: number };
  received_this_month: { amount: number };
};

/* Four numbers above the orders list: what needs attention today. */
const OverviewWidget = () => {
  useLang();
  const { data } = useQuery({
    queryKey: ["overview"],
    queryFn: () => sdk.client.fetch<Overview>("/admin/overview"),
    refetchInterval: 60_000,
  });
  if (!data) return null;
  const cards = [
    { to: "/finance", label: t("待确认到款"), value: String(data.awaiting_confirmation.count), sub: formatMoney(data.awaiting_confirmation.amount), tone: data.awaiting_confirmation.count ? "text-ui-tag-orange-text" : "" },
    { to: "/finance", label: t("逾期未付"), value: String(data.overdue.count), sub: formatMoney(data.overdue.amount), tone: data.overdue.count ? "text-ui-tag-red-text" : "" },
    { to: "/warehouse", label: t("待发货"), value: String(data.to_ship.count), sub: t("已放行订单"), tone: data.to_ship.count ? "text-ui-tag-blue-text" : "" },
    { to: "/quotes", label: t("待报价"), value: String(data.quotes_pending.count), sub: t("客户询价"), tone: data.quotes_pending.count ? "text-ui-tag-purple-text" : "" },
    { to: "/finance", label: t("本月已收"), value: formatMoney(data.received_this_month.amount), sub: t("按到账日期"), tone: "text-ui-tag-green-text" },
  ];
  return (
    <Container className="p-0 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-ui-border-base">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="px-5 py-4 hover:bg-ui-bg-subtle-hover">
            <Text size="xsmall" className="text-ui-fg-subtle">{c.label}</Text>
            <Heading level="h2" className={c.tone}>{c.value}</Heading>
            <Text size="xsmall" className="text-ui-fg-subtle">{c.sub}</Text>
          </Link>
        ))}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({ zone: "order.list.before" });

export default OverviewWidget;
