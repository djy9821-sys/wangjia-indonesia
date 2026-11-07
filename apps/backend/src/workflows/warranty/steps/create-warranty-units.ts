import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { WARRANTY_MODULE } from "../../../modules/warranty";
import WarrantyModuleService from "../../../modules/warranty/service";

export type CreateWarrantyUnitInput = {
  serial: string;
  code: string;
  product_id: string;
  variant_id?: string | null;
  product_title: string;
  variant_title?: string | null;
  batch?: string | null;
  warranty_months: number;
  created_by?: string | null;
};

export const createWarrantyUnitsStep = createStep(
  "create-warranty-units",
  async (input: { units: CreateWarrantyUnitInput[] }, { container }) => {
    const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    const units = await service.createWarrantyUnits(input.units);
    return new StepResponse(units, units.map((u) => u.id));
  },
  async (ids, { container }) => {
    if (!ids?.length) return;
    const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    await service.deleteWarrantyUnits(ids);
  }
);
