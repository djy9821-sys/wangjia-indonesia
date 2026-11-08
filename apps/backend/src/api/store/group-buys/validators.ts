import { z } from "@medusajs/framework/zod";

export const StoreListGroupBuys = z
  .object({
    status: z.enum(["open", "success", "failed", "cancelled", "all"]).optional(),
    product_id: z.string().optional(),
  })
  .strict();
export type StoreListGroupBuys = z.infer<typeof StoreListGroupBuys>;

export const StoreJoinGroupBuy = z
  .object({
    quantity: z.number().int().min(1).max(500),
    cart_id: z.string().min(1).optional(),
    region_id: z.string().min(1).optional(),
  })
  .strict();
export type StoreJoinGroupBuy = z.infer<typeof StoreJoinGroupBuy>;
