import { t, useLang } from "../../utils/i18n";
import { LangToggle } from "../../components/common/lang-toggle";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui";
import { Link } from "react-router-dom";
import { useWarehouseOrders } from "../../hooks/api/payment-plans";
import { formatDate, formatMoney } from "../../utils/payment-plan";

const WarehousePage = () => {
  useLang();
  const q = useWarehouseOrders();

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between"><Heading level="h2">{t("仓库：待发货订单")}</Heading><LangToggle /></div>
          <Text size="small" className="text-ui-fg-subtle">
            {t("只显示财务已确认到款并放行的订单。点开订单后用「Create Fulfillment」备货，再用「Mark as shipped」填写货运公司与单号。")}
          </Text>
        </div>
        {q.isLoading && <Text className="px-6 pb-4">{t("加载中…")}</Text>}
        {q.error && <Text className="px-6 pb-4 text-ui-fg-error">{(q.error as Error).message}</Text>}
        {q.data && q.data.orders.length === 0 && (
          <Text className="px-6 pb-4 text-ui-fg-subtle">{t("暂时没有可以发货的订单。")}</Text>
        )}
        {q.data && q.data.orders.length > 0 && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("订单")}</Table.HeaderCell>
                <Table.HeaderCell>{t("客户")}</Table.HeaderCell>
                <Table.HeaderCell>{t("货物")}</Table.HeaderCell>
                <Table.HeaderCell>{t("收货地")}</Table.HeaderCell>
                <Table.HeaderCell>{t("金额")}</Table.HeaderCell>
                <Table.HeaderCell>{t("放行时间")}</Table.HeaderCell>
                <Table.HeaderCell>{t("发货进度")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data.orders.map(({ plan, order, progress }) => (
                <Table.Row key={plan.id}>
                  <Table.Cell>
                    <Link to={`/orders/${order.id}`} className="text-ui-fg-interactive underline">
                      #{order.display_id}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>{order.company?.name ?? `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`}</span>
                      <span className="text-ui-fg-subtle txt-small">{order.customer?.phone ?? order.email}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col txt-small">
                      {order.items.map((i) => (
                        <span key={i.id}>{i.title} × {i.quantity}</span>
                      ))}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {[order.shipping_address?.city, order.shipping_address?.province].filter(Boolean).join(", ") || "-"}
                  </Table.Cell>
                  <Table.Cell>{formatMoney(order.total, order.currency_code)}</Table.Cell>
                  <Table.Cell>{formatDate(plan.released_at)}</Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={progress.fully_fulfilled ? "blue" : "orange"}>
                      {progress.fully_fulfilled ? t("已备货，待发运") : `${t("待备货 ")}${progress.fulfilled}/${progress.ordered}`}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </>
  );
};

export const config = defineRouteConfig({
  label: "仓库发货 / Gudang",
  icon: Buildings,
});

export default WarehousePage;
