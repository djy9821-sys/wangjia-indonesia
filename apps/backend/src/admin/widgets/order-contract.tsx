import { t, useLang } from "../utils/i18n";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Badge, Container, Heading, Text } from "@medusajs/ui";
import { formatDate } from "../utils/payment-plan";

/*
  Sales contract status written by the DocuSeal webhook
  (order.metadata.contract_*). Shown only once something is there, so small
  spare-part orders don't get an empty box.
*/
const OrderContractWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  useLang();
  const meta = (order.metadata ?? {}) as Record<string, unknown>;
  const signedAt = meta.contract_signed_at as string | undefined;
  const docs = (meta.contract_documents as string[] | undefined) ?? [];
  const audit = meta.contract_audit_log as string | undefined;
  if (!signedAt && !docs.length) return null;

  return (
    <Container className="flex flex-col gap-y-2 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">{t("销售合同")}</Heading>
        <Badge size="2xsmall" color="green">{t("已签署")}</Badge>
      </div>
      <Text size="small" className="text-ui-fg-subtle">{t("签署时间")}: {formatDate(signedAt ?? null)}</Text>
      <div className="flex flex-col txt-small">
        {docs.map((url, i) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive underline">
            {t("合同文件")} {docs.length > 1 ? i + 1 : ""}
          </a>
        ))}
        {audit && (
          <a href={audit} target="_blank" rel="noreferrer" className="text-ui-fg-interactive underline">{t("签署记录（审计日志）")}</a>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({ zone: "order.details.side.before" });

export default OrderContractWidget;
