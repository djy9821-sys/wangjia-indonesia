import { z } from "@medusajs/framework/zod";

export const AdminGenerateWarrantyUnits = z
  .object({
    product_id: z.string().min(1),
    variant_id: z.string().min(1).nullish(),
    quantity: z.number().int().min(1).max(500),
    batch: z.string().max(60).nullish(),
    warranty_months: z.number().int().min(1).max(60).default(12),
  })
  .strict();
export type AdminGenerateWarrantyUnits = z.infer<typeof AdminGenerateWarrantyUnits>;

export const AdminUpdateWarrantyUnit = z
  .object({
    status: z.enum(["in_stock", "sold", "void"]).optional(),
    order_id: z.string().nullish(),
    notes: z.string().max(2000).nullish(),
    warranty_months: z.number().int().min(1).max(60).optional(),
  })
  .strict();
export type AdminUpdateWarrantyUnit = z.infer<typeof AdminUpdateWarrantyUnit>;

export const AdminListWarrantyUnits = z.object({
  q: z.string().max(60).optional(),
  status: z.enum(["in_stock", "sold", "registered", "void"]).optional(),
  batch: z.string().max(60).optional(),
  customer_id: z.string().max(60).optional(),
  order_id: z.string().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type AdminListWarrantyUnits = z.infer<typeof AdminListWarrantyUnits>;

export const AdminExportWarrantyUnits = z.object({
  batch: z.string().max(60).optional(),
  ids: z.string().max(20000).optional(),
});
export type AdminExportWarrantyUnits = z.infer<typeof AdminExportWarrantyUnits>;

export const AdminLinkWarrantyUnit = z.object({ serial: z.string().min(4).max(200) }).strict();
export type AdminLinkWarrantyUnit = z.infer<typeof AdminLinkWarrantyUnit>;

/* Either the QR code (scanned / typed) or the id of a unit in one of the customer's orders. */
export const StoreRegisterWarranty = z
  .object({
    code: z.string().min(6).max(200).optional(),
    unit_id: z.string().min(6).max(60).optional(),
    farm_location: z.string().max(300).nullish(),
  })
  .strict()
  .refine((v) => Boolean(v.code || v.unit_id), { message: "code or unit_id is required" });
export type StoreRegisterWarranty = z.infer<typeof StoreRegisterWarranty>;
