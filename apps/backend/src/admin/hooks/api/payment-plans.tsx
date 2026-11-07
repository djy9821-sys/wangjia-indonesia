import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import type {
  AdminCancelPaymentPlan,
  AdminConfirmInstallment,
  AdminCreatePaymentPlan,
  AdminRefundInstallment,
  AdminRejectProof,
  ModuleInstallment,
  ModulePaymentPlan,
} from "../../../types/payment-plan";

export const paymentPlanQueryKey = queryKeysFactory("payment_plan");
export const installmentQueryKey = queryKeysFactory("payment_installment");
export const warehouseQueryKey = queryKeysFactory("warehouse_orders");

export type AdminPaymentPlanResponse = { payment_plan: ModulePaymentPlan | null };

export type InstallmentRow = ModuleInstallment & {
  plan?: ModulePaymentPlan;
  order?: {
    id: string;
    display_id: number;
    email: string;
    currency_code: string;
    total: number;
    company?: { name?: string } | null;
    customer?: { first_name?: string; last_name?: string } | null;
  } | null;
};

export type WarehouseRow = {
  plan: ModulePaymentPlan;
  order: {
    id: string;
    display_id: number;
    email: string;
    currency_code: string;
    total: number;
    created_at: string;
    company?: { name?: string } | null;
    customer?: { first_name?: string; last_name?: string; phone?: string } | null;
    shipping_address?: {
      address_1?: string;
      address_2?: string;
      city?: string;
      province?: string;
      phone?: string;
      metadata?: { lat?: number; lng?: number } | null;
    } | null;
    items: { id: string; title: string; quantity: number }[];
  };
  progress: {
    ordered: number;
    fulfilled: number;
    shipped: number;
    fully_fulfilled: boolean;
    fully_shipped: boolean;
  };
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>, orderId?: string) => {
  qc.invalidateQueries({ queryKey: paymentPlanQueryKey.all });
  qc.invalidateQueries({ queryKey: installmentQueryKey.all });
  qc.invalidateQueries({ queryKey: warehouseQueryKey.all });
  if (orderId) {
    qc.invalidateQueries({ queryKey: ["orders", orderId] });
  }
};

export const useOrderPaymentPlan = (orderId: string) =>
  useQuery({
    queryKey: paymentPlanQueryKey.detail(orderId),
    queryFn: () =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/orders/${orderId}/payment-plan`
      ),
  });

export const useCreatePaymentPlan = (orderId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminCreatePaymentPlan) =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/orders/${orderId}/payment-plan`,
        { method: "POST", body }
      ),
    onSuccess: () => invalidateAll(qc, orderId),
  });
};

export const useConfirmInstallment = (orderId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminConfirmInstallment & { id: string }) =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/payment-installments/${id}/confirm`,
        { method: "POST", body }
      ),
    onSuccess: () => invalidateAll(qc, orderId),
  });
};

export const useRejectProof = (orderId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminRejectProof & { id: string }) =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/payment-proofs/${id}/reject`,
        { method: "POST", body }
      ),
    onSuccess: () => invalidateAll(qc, orderId),
  });
};

export const useReleasePlan = (orderId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/payment-plans/${planId}/release`,
        { method: "POST", body: {} }
      ),
    onSuccess: () => invalidateAll(qc, orderId),
  });
};

export const useRefundInstallment = (orderId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminRefundInstallment & { id: string }) =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/payment-installments/${id}/refund`,
        { method: "POST", body }
      ),
    onSuccess: () => invalidateAll(qc, orderId),
  });
};

export const useCancelPlan = (orderId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminCancelPaymentPlan & { id: string }) =>
      sdk.client.fetch<AdminPaymentPlanResponse>(
        `/admin/payment-plans/${id}/cancel`,
        { method: "POST", body }
      ),
    onSuccess: () => invalidateAll(qc, orderId),
  });
};

export const useInstallments = (status?: string | string[]) =>
  useQuery({
    queryKey: installmentQueryKey.list({ status }),
    queryFn: () =>
      sdk.client.fetch<{ installments: InstallmentRow[]; count: number }>(
        `/admin/payment-installments`,
        { query: { status, limit: 100 } }
      ),
  });

export const useWarehouseOrders = () =>
  useQuery({
    queryKey: warehouseQueryKey.list(),
    queryFn: () =>
      sdk.client.fetch<{ orders: WarehouseRow[]; count: number }>(
        `/admin/warehouse/orders`
      ),
  });

export const useMyRole = () =>
  useQuery({
    queryKey: ["me", "role"],
    queryFn: async () => {
      const team = await sdk.client.fetch<{ me: { id: string; role: string; bootstrap: boolean } }>(
        "/admin/team"
      );
      return { role: team.me.role, bootstrap: team.me.bootstrap };
    },
  });
