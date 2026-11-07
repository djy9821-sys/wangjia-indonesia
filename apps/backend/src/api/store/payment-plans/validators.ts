import { z } from "@medusajs/framework/zod";

export type StoreSubmitPaymentProofType = z.infer<
  typeof StoreSubmitPaymentProof
>;
export const StoreSubmitPaymentProof = z
  .object({
    file: z.object({
      name: z.string().min(1),
      mime_type: z
        .string()
        .regex(/^(image\/(jpeg|png|webp|heic)|application\/pdf)$/),
      // base64 without data: prefix
      content: z.string().min(1),
    }),
    bank_name: z.string().nullish(),
    sender_name: z.string().nullish(),
    amount: z.number().nonnegative().nullish(),
    transferred_at: z.string().nullish(),
    note: z.string().max(1000).nullish(),
  })
  .strict();

export type StoreCreateMidtransType = z.infer<typeof StoreCreateMidtrans>;
export const StoreCreateMidtrans = z
  .object({
    finish_url: z.string().url().nullish(),
  })
  .strict();
