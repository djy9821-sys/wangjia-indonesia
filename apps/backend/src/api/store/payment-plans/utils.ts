import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";

export const storePaymentPlanFields = [
  "id",
  "order_id",
  "currency_code",
  "total_amount",
  "release_policy",
  "status",
  "released_at",
  "note",
  "created_at",
  "installments.id",
  "installments.sequence",
  "installments.label",
  "installments.amount",
  "installments.due_date",
  "installments.status",
  "installments.payment_method",
  "installments.paid_at",
  "installments.proofs.id",
  "installments.proofs.file_url",
  "installments.proofs.bank_name",
  "installments.proofs.sender_name",
  "installments.proofs.amount",
  "installments.proofs.transferred_at",
  "installments.proofs.status",
  "installments.proofs.review_note",
  "installments.proofs.created_at",
];

export async function assertOrderOwnedByCustomer(
  container: MedusaContainer,
  orderId: string,
  customerId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id"],
    filters: { id: orderId },
  });
  if (!order || order.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found");
  }
  return order;
}

export async function assertInstallmentOwnedByCustomer(
  container: MedusaContainer,
  installmentId: string,
  customerId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [installment],
  } = await query.graph({
    entity: "payment_installment",
    fields: ["id", "status", "amount", "label", "plan_id", "plan.order_id"],
    filters: { id: installmentId },
  });
  if (!installment) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Installment not found");
  }
  await assertOrderOwnedByCustomer(
    container,
    installment.plan.order_id,
    customerId
  );
  return installment;
}

export async function retrieveStorePaymentPlan(
  container: MedusaContainer,
  filters: Record<string, unknown>
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: plans } = await query.graph({
    entity: "payment_plan",
    fields: storePaymentPlanFields,
    filters,
  });
  return plans[0] ?? null;
}
