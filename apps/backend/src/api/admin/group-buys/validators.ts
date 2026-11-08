import { z } from "@medusajs/framework/zod";

export const AdminListGroupBuys = z
  .object({ status: z.enum(["open", "success", "failed", "cancelled", "all"]).optional() })
  .strict();
export type AdminListGroupBuys = z.infer<typeof AdminListGroupBuys>;

export const AdminCreateGroupBuy = z
  .object({
    title: z.string().min(3).max(120),
    variant_id: z.string().min(1),
    group_price: z.number().positive(),
    min_quantity: z.number().int().min(2).max(10000),
    max_quantity: z.number().int().min(2).max(100000).nullish(),
    ends_at: z.coerce.date(),
    note: z.string().max(500).nullish(),
  })
  .strict()
  .refine((v) => !v.max_quantity || v.max_quantity >= v.min_quantity, { message: "max_quantity must be >= min_quantity" })
  .refine((v) => v.ends_at.getTime() > Date.now(), { message: "ends_at must be in the future" });
export type AdminCreateGroupBuy = z.infer<typeof AdminCreateGroupBuy>;

export const AdminUpdateGroupBuy = z
  .object({
    title: z.string().min(3).max(120).optional(),
    min_quantity: z.number().int().min(2).max(10000).optional(),
    max_quantity: z.number().int().min(2).max(100000).nullish(),
    ends_at: z.coerce.date().optional(),
    note: z.string().max(500).nullish(),
    status: z.enum(["open", "cancelled"]).optional(),
  })
  .strict();
export type AdminUpdateGroupBuy = z.infer<typeof AdminUpdateGroupBuy>;
