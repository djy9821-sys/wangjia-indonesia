import { t, useLang } from "../utils/i18n";
import { LangToggle } from "../components/common/lang-toggle";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui";
import { useState } from "react";
import {
  useCancelPlan,
  useConfirmInstallment,
  useCreatePaymentPlan,
  useMyRole,
  useOrderPaymentPlan,
  useRefundInstallment,
  useRejectProof,
  useReleasePlan,
} from "../hooks/api/payment-plans";
import type {
  ModuleInstallment,
  ModulePaymentPlan,
  ModulePaymentProof,
} from "../../types/payment-plan";
import {
  formatDate,
  formatMoney,
  INSTALLMENT_STATUS_COLOR,
  INSTALLMENT_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PROOF_STATUS_LABEL,
  RELEASE_POLICY_LABEL,
} from "../utils/payment-plan";

type Row = { label: string; amount: string; due_date: string };

const errMsg = (e: unknown) =>
  (e as { message?: string })?.message ?? t("操作失败");

/* ---------- create form ---------- */

const CreatePlanForm = ({ order }: { order: AdminOrder }) => {
  const total = Number(order.total ?? 0);
  const currency = order.currency_code;
  const [policy, setPolicy] = useState<"deposit_paid" | "full_paid">(
    "deposit_paid"
  );
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { label: t("Uang muka 30% / 定金"), amount: String(Math.round(total * 0.3)), due_date: "" },
    { label: t("Pelunasan 70% / 尾款"), amount: String(total - Math.round(total * 0.3)), due_date: "" },
  ]);
  const create = useCreatePaymentPlan(order.id);

  const preset = (parts: number[]) => {
    const labels =
      parts.length === 1
        ? [t("Pembayaran penuh / 全款")]
        : parts.length === 2
          ? [t("Uang muka / 定金"), t("Pelunasan / 尾款")]
          : parts.map((_, i) => `Tahap ${i + 1} / 第 ${i + 1} 期`);
    let remaining = total;
    const next = parts.map((p, i) => {
      const amt =
        i === parts.length - 1 ? remaining : Math.round((total * p) / 100);
      remaining -= amt;
      return {
        label: `${labels[i]} ${p}%`,
        amount: String(amt),
        due_date: "",
      };
    });
    setRows(next);
  };

  const sum = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const diff = total - sum;

  const submit = async () => {
    try {
      await create.mutateAsync({
        release_policy: policy,
        note: note || null,
        installments: rows.map((r) => ({
          label: r.label,
          amount: Number(r.amount),
          due_date: r.due_date || null,
        })),
      });
      toast.success(t("付款计划已创建"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <Text size="small" className="text-ui-fg-subtle">
        {t("订单总额")} {formatMoney(total, currency)}{t("。把总额拆成几期，客户在 App 里按期付款。")}
      </Text>

      <div className="flex flex-wrap gap-2">
        <Button size="small" variant="secondary" onClick={() => preset([30, 70])}>
          30% / 70%
        </Button>
        <Button size="small" variant="secondary" onClick={() => preset([50, 50])}>
          50% / 50%
        </Button>
        <Button size="small" variant="secondary" onClick={() => preset([30, 40, 30])}>
          30% / 40% / 30%
        </Button>
        <Button size="small" variant="secondary" onClick={() => preset([100])}>
          {t("全款")}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-y-1">
          <Label size="small">{t("发货条件")}</Label>
          <Select value={policy} onValueChange={(v) => setPolicy(v as typeof policy)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="deposit_paid">{t(RELEASE_POLICY_LABEL.deposit_paid)}</Select.Item>
              <Select.Item value="full_paid">{t(RELEASE_POLICY_LABEL.full_paid)}</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">{t("备注（客户可见）")}</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("例如：银行账户 BCA 123456 a.n. PT ...")} />
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_180px_160px_auto]">
            <Input
              value={r.label}
              placeholder={t("名称，如 定金 30%")}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
              }
            />
            <Input
              type="number"
              value={r.amount}
              placeholder={t("金额")}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
              }
            />
            <Input
              type="date"
              value={r.due_date}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, due_date: e.target.value } : x)))
              }
            />
            <Button
              size="small"
              variant="transparent"
              disabled={rows.length === 1}
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
            >
              {t("删除")}
            </Button>
          </div>
        ))}
        <div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setRows([...rows, { label: "", amount: "0", due_date: "" }])}
          >
            {t("+ 加一期")}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Text size="small" className={diff === 0 ? "text-ui-fg-subtle" : "text-ui-fg-error"}>
          {t("合计")} {formatMoney(sum, currency)}
          {diff !== 0 && `${t("，与订单总额相差")} ${formatMoney(diff, currency)}`}
        </Text>
        <Button size="small" onClick={submit} isLoading={create.isPending} disabled={diff !== 0}>
          {t("创建付款计划")}
        </Button>
      </div>
    </div>
  );
};

/* ---------- proof row ---------- */

const ProofRow = ({
  proof,
  installment,
  plan,
  canFinance,
  orderId,
}: {
  proof: ModulePaymentProof;
  installment: ModuleInstallment;
  plan: ModulePaymentPlan;
  canFinance: boolean;
  orderId: string;
}) => {
  const confirm = useConfirmInstallment(orderId);
  const reject = useRejectProof(orderId);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const onAccept = async () => {
    try {
      await confirm.mutateAsync({ id: installment.id, proof_id: proof.id, payment_method: "bank_transfer" });
      toast.success(t("已确认到账"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const onReject = async () => {
    try {
      await reject.mutateAsync({ id: proof.id, review_note: reason || null });
      toast.success(t("凭证已拒绝"));
      setRejecting(false);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-3 text-sm flex flex-col gap-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a href={proof.file_url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive underline">
          {t("查看转账凭证")}
        </a>
        <Badge size="2xsmall" color={proof.status === "accepted" ? "green" : proof.status === "rejected" ? "red" : "orange"}>
          {t(PROOF_STATUS_LABEL[proof.status])}
        </Badge>
        <span className="text-ui-fg-subtle">
          {proof.bank_name ?? "-"} · {proof.sender_name ?? "-"} ·{" "}
          {proof.amount != null ? formatMoney(proof.amount, plan.currency_code) : t("金额未填")} ·{" "}
          {formatDate(proof.transferred_at ?? proof.created_at)}
        </span>
      </div>
      {proof.note && <Text size="xsmall" className="text-ui-fg-subtle">{t("客户备注：")}{proof.note}</Text>}
      {proof.review_note && <Text size="xsmall" className="text-ui-fg-error">{t("审核意见：")}{proof.review_note}</Text>}
      {canFinance && proof.status === "pending" && installment.status !== "paid" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="small" onClick={onAccept} isLoading={confirm.isPending}>
            {t("核对无误，确认到账")}
          </Button>
          {!rejecting ? (
            <Button size="small" variant="danger" onClick={() => setRejecting(true)}>
              {t("拒绝凭证")}
            </Button>
          ) : (
            <>
              <Input size="small" placeholder={t("拒绝原因（客户可见）")} value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button size="small" variant="danger" onClick={onReject} isLoading={reject.isPending}>{t("确认拒绝")}</Button>
              <Button size="small" variant="transparent" onClick={() => setRejecting(false)}>{t("取消")}</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- refund form ---------- */

const RefundForm = ({
  inst,
  plan,
  orderId,
}: {
  inst: ModuleInstallment;
  plan: ModulePaymentPlan;
  orderId: string;
}) => {
  const refund = useRefundInstallment(orderId);
  const [open, setOpen] = useState(false);
  const remaining = Number(inst.amount) - Number(inst.refunded_amount ?? 0);
  const [amount, setAmount] = useState(String(remaining));
  const [reason, setReason] = useState("");
  const [bank, setBank] = useState("");
  const method = inst.payment_method === "midtrans" ? "midtrans" : "bank_transfer";

  if (remaining <= 0) return null;
  if (!open) {
    return (
      <div>
        <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
          {t("退款")}
        </Button>
      </div>
    );
  }
  const submit = async () => {
    try {
      await refund.mutateAsync({
        id: inst.id,
        amount: Number(amount),
        reason: reason || null,
        method,
        bank_account: method === "bank_transfer" ? bank || null : null,
      });
      toast.success(t("退款已记录"));
      setOpen(false);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <div className="rounded-md border border-ui-border-base p-3 flex flex-col gap-y-2">
      <Text size="small" weight="plus">
        {t("退款")}（{method === "midtrans" ? t("通过 Midtrans 原路退回") : t("财务线下转回后登记")}），{t("最多")} {formatMoney(remaining, plan.currency_code)}
      </Text>
      <div className="grid gap-2 md:grid-cols-3">
        <Input size="small" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("金额")} />
        <Input size="small" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("原因（客户可见）")} />
        {method === "bank_transfer" && (
          <Input size="small" value={bank} onChange={(e) => setBank(e.target.value)} placeholder={t("退回账户 / 流水号")} />
        )}
      </div>
      <div className="flex gap-2">
        <Button size="small" variant="danger" onClick={submit} isLoading={refund.isPending}>{t("确认退款")}</Button>
        <Button size="small" variant="transparent" onClick={() => setOpen(false)}>{t("取消")}</Button>
      </div>
    </div>
  );
};

/* ---------- plan view ---------- */

const PlanView = ({ plan, orderId, role }: { plan: ModulePaymentPlan; orderId: string; role: string }) => {
  const canFinance = role === "owner" || role === "finance";
  const isOwner = role === "owner";
  const confirm = useConfirmInstallment(orderId);
  const release = useReleasePlan(orderId);
  const cancelPlan = useCancelPlan(orderId);
  const [manualNote, setManualNote] = useState<Record<string, string>>({});
  const canCancel = (role === "owner" || role === "finance" || role === "sales") && plan.status !== "cancelled";

  const onCancelPlan = async (cancelOrder: boolean) => {
    const reason = window.prompt(
      cancelOrder
        ? t("取消原因（客户可见）。未付款的期数会取消，订单一并取消；已到账的款项需另行退款。")
        : t("仅取消付款计划、保留订单（用于改单加运费后重新建计划）。原因：")
    );
    if (reason === null) return;
    try {
      await cancelPlan.mutateAsync({ id: plan.id, reason: reason || null, cancel_order: cancelOrder });
      toast.success(cancelOrder ? t("付款计划与订单已取消") : t("付款计划已取消，现在可以改单，改完请重新创建付款计划"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const installments = [...(plan.installments ?? [])].sort((a, b) => a.sequence - b.sequence);
  const paid = installments.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  const manualConfirm = async (inst: ModuleInstallment) => {
    try {
      await confirm.mutateAsync({ id: inst.id, payment_method: "other", note: manualNote[inst.id] || null });
      toast.success(t("已确认到账"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const forceRelease = async () => {
    try {
      await release.mutateAsync(plan.id);
      toast.success(t("已放行，仓库可以发货"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {plan.released_at ? (
            <Badge color="green">{t("已放行发货 · ")}{formatDate(plan.released_at)}</Badge>
          ) : (
            <Badge color="orange">{t("未放行，仓库不能发货")}</Badge>
          )}
          <Badge color="grey">{t(RELEASE_POLICY_LABEL[plan.release_policy])}</Badge>
          <Badge color={plan.status === "completed" ? "green" : "blue"}>
            {plan.status === "completed" ? t("全部付清") : plan.status === "cancelled" ? t("已取消") : t("进行中")}
          </Badge>
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          {t("已收 ")}{formatMoney(paid, plan.currency_code)} / {formatMoney(plan.total_amount, plan.currency_code)}
        </Text>
      </div>
      {plan.note && <Text size="small" className="text-ui-fg-subtle">{t("备注：")}{plan.note}</Text>}

      <div className="flex flex-col gap-y-3">
        {installments.map((inst) => (
          <div key={inst.id} className="rounded-lg border border-ui-border-base p-4 flex flex-col gap-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-x-3">
                <Text weight="plus">
                  {inst.sequence}. {inst.label}
                </Text>
                <Badge size="2xsmall" color={INSTALLMENT_STATUS_COLOR[inst.status]}>
                  {t(INSTALLMENT_STATUS_LABEL[inst.status])}
                </Badge>
                {inst.payment_method && (
                  <Badge size="2xsmall" color="grey">{t(PAYMENT_METHOD_LABEL[inst.payment_method])}</Badge>
                )}
              </div>
              <Text weight="plus">{formatMoney(inst.amount, plan.currency_code)}</Text>
            </div>
            <div className="flex flex-wrap gap-x-4 text-ui-fg-subtle txt-small">
              <span>{t("到期：")}{inst.due_date ? formatDate(inst.due_date).slice(0, 10) : t("未设定")}</span>
              {inst.paid_at && <span>{t("到账：")}{formatDate(inst.paid_at)}</span>}
              {inst.confirmed_by && <span>{t("确认人：")}{inst.confirmed_by === "midtrans" ? t("Midtrans 自动") : inst.confirmed_by}</span>}
              {inst.gateway_reference && <span>{t("Midtrans 单号：")}{inst.gateway_reference}</span>}
            </div>
            {(inst.proofs ?? []).map((p) => (
              <ProofRow key={p.id} proof={p} installment={inst} plan={plan} canFinance={canFinance} orderId={orderId} />
            ))}
            {(inst.refunds ?? []).map((r) => (
              <Text key={r.id} size="xsmall" className="text-ui-fg-subtle">
                {t("已退款 ")}{formatMoney(r.amount, plan.currency_code)} · {t(PAYMENT_METHOD_LABEL[r.method])} · {formatDate(r.completed_at ?? r.created_at)}
                {r.reason ? ` · ${r.reason}` : ""}{r.bank_account ? ` · ${r.bank_account}` : ""}
              </Text>
            ))}
            {canFinance && (inst.status === "paid" || inst.status === "refunded") && (
              <RefundForm inst={inst} plan={plan} orderId={orderId} />
            )}
            {canFinance && inst.status !== "paid" && inst.status !== "cancelled" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  size="small"
                  placeholder={t("无凭证直接确认：填写收款说明（如 银行流水号）")}
                  value={manualNote[inst.id] ?? ""}
                  onChange={(e) => setManualNote({ ...manualNote, [inst.id]: e.target.value })}
                />
                <Button size="small" variant="secondary" onClick={() => manualConfirm(inst)} isLoading={confirm.isPending}>
                  {t("手动确认到账")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        {canCancel && (
          <>
            <Button size="small" variant="secondary" onClick={() => onCancelPlan(false)} isLoading={cancelPlan.isPending}>
              {t("仅取消计划（改单用）")}
            </Button>
            <Button size="small" variant="secondary" onClick={() => onCancelPlan(true)} isLoading={cancelPlan.isPending}>
              {t("取消付款计划与订单")}
            </Button>
          </>
        )}
        {isOwner && !plan.released_at && plan.status !== "cancelled" && (
          <Button size="small" variant="danger" onClick={forceRelease} isLoading={release.isPending}>
            {t("负责人强制放行发货")}
          </Button>
        )}
      </div>
    </div>
  );
};

/* ---------- widget ---------- */

const OrderPaymentPlanWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  useLang();
  const { data, isLoading, error } = useOrderPaymentPlan(order.id);
  const me = useMyRole();
  const role = me.data?.role ?? "none";
  const canCreate = role === "owner" || role === "sales" || role === "finance";

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{t("付款计划与到款确认")}</Heading>
          <div className="flex items-center gap-x-3">
            {(() => {
              const phone = (order as any).customer?.phone || (order as any).shipping_address?.phone;
              if (!phone) return null;
              const wa = String(phone).replace(/[^\d]/g, "").replace(/^0/, "62");
              const text = encodeURIComponent(`Halo, ini WANGJIA mengenai pesanan #${order.display_id}.`);
              return (
                <a href={`https://wa.me/${wa}?text=${text}`} target="_blank" rel="noreferrer">
                  <Button size="small" variant="secondary">{t("WhatsApp 客户")}</Button>
                </a>
              );
            })()}
            <Text size="small" className="text-ui-fg-subtle">
              {t("当前角色：")}{role}
            </Text>
            <LangToggle />
          </div>
        </div>
        {isLoading && <Text className="px-6 py-4">{t("加载中…")}</Text>}
        {error && <Text className="px-6 py-4 text-ui-fg-error">{errMsg(error)}</Text>}
        {!isLoading && !error && data?.payment_plan && (
          <PlanView plan={data.payment_plan} orderId={order.id} role={role} />
        )}
        {!isLoading && !error && !data?.payment_plan && (
          canCreate ? (
            <CreatePlanForm order={order} />
          ) : (
            <Text className="px-6 py-4 text-ui-fg-subtle">{t("尚未创建付款计划，请联系销售或财务。")}</Text>
          )
        )}
      </Container>
      <Toaster />
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default OrderPaymentPlanWidget;
