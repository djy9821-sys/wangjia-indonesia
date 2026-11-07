import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "@medusajs/framework/zod";

export type AdminGetPaymentPlanParamsType = z.infer<
  typeof AdminGetPaymentPlanParams
>;
export const AdminGetPaymentPlanParams = createFindParams({
  limit: 20,
  offset: 0,
}).strict();

export type AdminListInstallmentsParamsType = z.infer<
  typeof AdminListInstallmentsParams
>;
export const AdminListInstallmentsParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(
    z.object({
      status: z
        .union([z.string(), z.array(z.string())])
        .optional(),
    })
  )
  .strict();

export type AdminCreatePaymentPlanType = z.infer<typeof AdminCreatePaymentPlan>;
export const AdminCreatePaymentPlan = z
  .object({
    release_policy: z.enum(["deposit_paid", "full_paid"]).optional(),
    note: z.string().nullish(),
    installments: z
      .array(
        z.object({
          label: z.string().min(1),
          amount: z.number().positive(),
          due_date: z.string().nullish(),
        })
      )
      .min(1)
      .max(12),
  })
  .strict();

export type AdminConfirmInstallmentType = z.infer<
  typeof AdminConfirmInstallment
>;
export const AdminConfirmInstallment = z
  .object({
    payment_method: z.enum(["midtrans", "bank_transfer", "other"]).optional(),
    proof_id: z.string().nullish(),
    note: z.string().nullish(),
  })
  .strict();

export type AdminRejectProofType = z.infer<typeof AdminRejectProof>;
export const AdminRejectProof = z
  .object({
    review_note: z.string().nullish(),
  })
  .strict();

export type AdminRefundInstallmentType = z.infer<typeof AdminRefundInstallment>;
export const AdminRefundInstallment = z
  .object({
    amount: z.number().positive(),
    reason: z.string().max(255).nullish(),
    method: z.enum(["midtrans", "bank_transfer", "other"]).optional(),
    bank_account: z.string().max(200).nullish(),
    note: z.string().max(1000).nullish(),
  })
  .strict();

export type AdminCancelPaymentPlanType = z.infer<typeof AdminCancelPaymentPlan>;
export const AdminCancelPaymentPlan = z
  .object({
    reason: z.string().max(500).nullish(),
    cancel_order: z.boolean().optional(),
  })
  .strict();

export type AdminSetTeamRoleType = z.infer<typeof AdminSetTeamRole>;
export const AdminSetTeamRole = z
  .object({ role: z.enum(["owner", "sales", "finance", "warehouse", "none"]) })
  .strict();

export type AdminReleasePlanType = z.infer<typeof AdminReleasePlan>;
export const AdminReleasePlan = z.object({}).strict();
