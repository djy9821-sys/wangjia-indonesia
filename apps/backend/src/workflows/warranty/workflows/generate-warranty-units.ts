import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { formatSerial, generateVerificationCode } from "../../../utils/warranty";
import { createWarrantyUnitsStep } from "../steps/create-warranty-units";
import { prepareWarrantyBatchStep } from "../steps/next-serial-sequence";

export type GenerateWarrantyUnitsInput = {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  batch?: string | null;
  warranty_months: number;
  created_by?: string | null;
};

/* Prints a batch of serial numbers + QR codes for units leaving the factory. */
export const generateWarrantyUnitsWorkflow = createWorkflow(
  "generate-warranty-units",
  (input: GenerateWarrantyUnitsInput) => {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "title", "variants.id", "variants.title"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    });

    const product = transform({ products }, ({ products }) => products[0]);
    const prepared = prepareWarrantyBatchStep({ product, variant_id: input.variant_id });

    const units = transform({ input, product, prepared }, ({ input, product, prepared }) =>
      Array.from({ length: input.quantity }, (_, i) => ({
        serial: formatSerial(prepared.start + i),
        code: generateVerificationCode(),
        product_id: product.id,
        variant_id: prepared.variant?.id ?? null,
        product_title: product.title,
        variant_title: prepared.variant?.title ?? null,
        batch: input.batch ?? null,
        warranty_months: input.warranty_months,
        created_by: input.created_by ?? null,
      }))
    );

    const created = createWarrantyUnitsStep({ units });
    return new WorkflowResponse(created);
  }
);
