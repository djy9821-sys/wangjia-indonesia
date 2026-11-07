import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { WARRANTY_MODULE } from "../../../modules/warranty";
import WarrantyModuleService from "../../../modules/warranty/service";

type Input = {
  product: { id: string; title: string; variants?: { id: string; title: string }[] | null };
  variant_id?: string | null;
};

/*
  Validates the chosen variant and returns the next serial number. Serials
  are a running count across all units (voided and soft-deleted included),
  so a reprinted batch never reuses a number.
*/
export const prepareWarrantyBatchStep = createStep(
  "prepare-warranty-batch",
  async (input: Input, { container }) => {
    const variant = input.variant_id
      ? input.product.variants?.find((v) => v.id === input.variant_id) ?? null
      : null;
    if (input.variant_id && !variant) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "规格不属于该产品");
    }
    const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    const [, count] = await service.listAndCountWarrantyUnits(
      {},
      { take: 1, withDeleted: true } as any
    );
    return new StepResponse({ start: count + 1, variant });
  }
);
