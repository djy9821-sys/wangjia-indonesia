export type ReleasePolicy = "deposit_paid" | "full_paid";
export type PaymentPlanStatus = "active" | "completed" | "cancelled";
export type InstallmentStatus =
  | "unpaid"
  | "awaiting_confirmation"
  | "paid"
  | "refunded"
  | "cancelled";
export type RefundStatus = "pending" | "completed" | "failed";

export type ModulePaymentRefund = {
  id: string;
  installment_id: string;
  amount: number;
  method: InstallmentPaymentMethod;
  status: RefundStatus;
  reason: string | null;
  gateway_reference: string | null;
  bank_account: string | null;
  note: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
};
export type InstallmentPaymentMethod = "midtrans" | "bank_transfer" | "other";
export type PaymentProofStatus = "pending" | "accepted" | "rejected";

export type ModulePaymentProof = {
  id: string;
  installment_id: string;
  file_url: string;
  file_id: string | null;
  bank_name: string | null;
  sender_name: string | null;
  amount: number | null;
  transferred_at: string | null;
  note: string | null;
  status: PaymentProofStatus;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ModuleInstallment = {
  id: string;
  plan_id: string;
  sequence: number;
  label: string;
  amount: number;
  due_date: string | null;
  status: InstallmentStatus;
  payment_method: InstallmentPaymentMethod | null;
  gateway_reference: string | null;
  gateway_payload: Record<string, unknown> | null;
  paid_at: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  note: string | null;
  refunded_amount: number;
  proofs?: ModulePaymentProof[];
  refunds?: ModulePaymentRefund[];
  created_at: string;
  updated_at: string;
};

export type ModulePaymentPlan = {
  id: string;
  order_id: string;
  currency_code: string;
  total_amount: number;
  release_policy: ReleasePolicy;
  status: PaymentPlanStatus;
  released_at: string | null;
  released_by: string | null;
  note: string | null;
  created_by: string | null;
  installments?: ModuleInstallment[];
  created_at: string;
  updated_at: string;
};

export type ModuleCreateInstallment = {
  sequence: number;
  label: string;
  amount: number;
  due_date?: Date | null;
};

export type ModuleCreatePaymentPlan = {
  order_id: string;
  currency_code: string;
  total_amount: number;
  release_policy?: ReleasePolicy;
  note?: string | null;
  created_by?: string | null;
};

/* HTTP */

export type AdminCreatePaymentPlan = {
  release_policy?: ReleasePolicy;
  note?: string | null;
  installments: {
    label: string;
    amount: number;
    due_date?: string | null;
  }[];
};

export type AdminConfirmInstallment = {
  payment_method?: InstallmentPaymentMethod;
  proof_id?: string | null;
  note?: string | null;
};

export type AdminRefundInstallment = {
  amount: number;
  reason?: string | null;
  method?: InstallmentPaymentMethod;
  bank_account?: string | null;
  note?: string | null;
};

export type AdminCancelPaymentPlan = {
  reason?: string | null;
  cancel_order?: boolean;
};

export type AdminRejectProof = {
  review_note?: string | null;
};

export type StoreSubmitPaymentProof = {
  bank_name?: string | null;
  sender_name?: string | null;
  amount?: number | null;
  transferred_at?: string | null;
  note?: string | null;
};
