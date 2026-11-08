import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { GROUP_BUY_MODULE } from "../../../modules/group-buy";
import GroupBuyModuleService from "../../../modules/group-buy/service";

export type CreateGroupBuyInput = {
  title: string;
  variant_id: string;
  group_price: number;
  min_quantity: number;
  max_quantity?: number | null;
  ends_at: Date;
  note?: string | null;
  created_by?: string | null;
  currency_code?: string;
};

/* Snapshots the variant/product and the current list price, then creates the group buy. */
export const createGroupBuyStep = createStep(
  "create-group-buy",
  async (input: CreateGroupBuyInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    const currency = (input.currency_code ?? "idr").toLowerCase();
    const {
      data: [variant],
    } = await query.graph({
      entity: "product_variant",
      fields: ["id", "title", "product.id", "product.title", "product.handle", "product.thumbnail", "prices.amount", "prices.currency_code"],
      filters: { id: input.variant_id },
    });
    if (!variant?.product) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Varian ${input.variant_id} tidak ditemukan.`);
    }
    // List price in the requested currency; fall back to the variant's first
    // price (and its currency) so a catalogue priced in one currency still works.
    const prices = (((variant as any).prices ?? []) as any[]).filter((p: any) => p?.amount != null);
    const regular = prices.find((p: any) => p?.currency_code === currency) ?? prices[0] ?? null;
    const currencyCode = regular?.currency_code ?? currency;
    if (regular && Number(input.group_price) >= Number(regular.amount)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Harga patungan harus lebih rendah dari harga normal.");
    }
    const created = await service.createGroupBuys({
      title: input.title,
      product_id: variant.product.id,
      product_handle: variant.product.handle ?? null,
      product_title: variant.product.title,
      variant_id: variant.id,
      variant_title: variant.title ?? null,
      thumbnail: variant.product.thumbnail ?? null,
      currency_code: currencyCode,
      group_price: input.group_price,
      regular_price: regular ? Number(regular.amount) : null,
      min_quantity: input.min_quantity,
      max_quantity: input.max_quantity ?? null,
      ends_at: input.ends_at,
      note: input.note ?? null,
      created_by: input.created_by ?? null,
    });
    return new StepResponse(created, created.id);
  },
  async (id, { container }) => {
    if (!id) return;
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    await service.deleteGroupBuys(id);
  }
);
