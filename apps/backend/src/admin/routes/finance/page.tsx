import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CurrencyDollar } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Table, Text, Toaster, toast } from "@medusajs/ui";
import { Link } from "react-router-dom";
import {
  InstallmentRow,
  useConfirmInstallment,
  useInstallments,
  useRejectProof,
} from "../../hooks/api/payment-plans";
import {
  formatDate,
  formatMoney,
  INSTALLMENT_STATUS_COLOR,
  INSTALLMENT_STATUS_LABEL,
} from "../../utils/payment-plan";

const Row = ({ row }: { row: InstallmentRow }) => {
  const confirm = useConfirmInstallment(row.order?.id);
  const reject = useRejectProof(row.order?.id);
  const pending = (row.proofs ?? []).filter((p) => p.status === "pending");
  const proof = pending[0];
  const currency = row.plan?.currency_code ?? row.order?.currency_code ?? "idr";

  const onConfirm = async () => {
    try {
      await confirm.mutateAsync({
        id: row.id,
        proof_id: proof?.id ?? null,
        payment_method: proof ? "bank_transfer" : "other",
      });
      toast.success("已确认到账");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const onReject = async () => {
    if (!proof) return;
    const review_note = window.prompt("拒绝原因（客户可见）") ?? "";
    try {
      await reject.mutateAsync({ id: proof.id, review_note });
      toast.success("凭证已拒绝");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Table.Row>
      <Table.Cell>
        {row.order ? (
          <Link to={`/orders/${row.order.id}`} className="text-ui-fg-interactive underline">
            #{row.order.display_id}
          </Link>
        ) : (
          "-"
        )}
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col">
          <span>{row.order?.company?.name ?? `${row.order?.customer?.first_name ?? ""} ${row.order?.customer?.last_name ?? ""}`}</span>
          <span className="text-ui-fg-subtle txt-small">{row.order?.email}</span>
        </div>
      </Table.Cell>
      <Table.Cell>{row.sequence}. {row.label}</Table.Cell>
      <Table.Cell>{formatMoney(row.amount, currency)}</Table.Cell>
      <Table.Cell>
        <Badge size="2xsmall" color={INSTALLMENT_STATUS_COLOR[row.status]}>
          {INSTALLMENT_STATUS_LABEL[row.status]}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        {proof ? (
          <div className="flex flex-col txt-small">
            <a href={proof.file_url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive underline">查看凭证</a>
            <span className="text-ui-fg-subtle">{proof.bank_name ?? "-"} · {proof.sender_name ?? "-"} · {proof.amount != null ? formatMoney(proof.amount, currency) : ""}</span>
            <span className="text-ui-fg-subtle">{formatDate(proof.transferred_at ?? proof.created_at)}</span>
          </div>
        ) : (
          <span className="text-ui-fg-subtle txt-small">{row.gateway_reference ? `Midtrans ${row.gateway_reference}` : "无凭证"}</span>
        )}
      </Table.Cell>
      <Table.Cell>
        {row.status !== "paid" && row.status !== "cancelled" && (
          <div className="flex gap-2">
            <Button size="small" onClick={onConfirm} isLoading={confirm.isPending}>确认到账</Button>
            {proof && (
              <Button size="small" variant="danger" onClick={onReject} isLoading={reject.isPending}>拒绝</Button>
            )}
          </div>
        )}
      </Table.Cell>
    </Table.Row>
  );
};

const FinancePage = () => {
  const awaiting = useInstallments("awaiting_confirmation");
  const unpaid = useInstallments("unpaid");

  const Section = ({ title, q, hint }: { title: string; q: typeof awaiting; hint: string }) => (
    <Container className="flex flex-col p-0 overflow-hidden">
      <div className="px-6 py-4">
        <Heading level="h2">{title}</Heading>
        <Text size="small" className="text-ui-fg-subtle">{hint}</Text>
      </div>
      {q.isLoading && <Text className="px-6 pb-4">加载中…</Text>}
      {q.error && <Text className="px-6 pb-4 text-ui-fg-error">{(q.error as Error).message}</Text>}
      {q.data && q.data.installments.length === 0 && <Text className="px-6 pb-4 text-ui-fg-subtle">暂无</Text>}
      {q.data && q.data.installments.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>订单</Table.HeaderCell>
              <Table.HeaderCell>客户</Table.HeaderCell>
              <Table.HeaderCell>期数</Table.HeaderCell>
              <Table.HeaderCell>金额</Table.HeaderCell>
              <Table.HeaderCell>状态</Table.HeaderCell>
              <Table.HeaderCell>凭证</Table.HeaderCell>
              <Table.HeaderCell>操作</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {q.data.installments.map((r) => <Row key={r.id} row={r} />)}
          </Table.Body>
        </Table>
      )}
    </Container>
  );

  return (
    <div className="flex flex-col gap-y-4">
      <Section title="财务：待确认到款" q={awaiting} hint="客户已上传转账凭证或 Midtrans 支付处理中。核对银行流水后确认，仓库才会看到发货任务。" />
      <Section title="尚未付款的款项" q={unpaid} hint="已创建付款计划但客户还没付的期数。" />
      <Toaster />
    </div>
  );
};

export const config = defineRouteConfig({
  label: "财务到款",
  icon: CurrencyDollar,
});

export default FinancePage;
