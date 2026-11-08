import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { GROUP_BUY_MODULE } from "../../../modules/group-buy";
import GroupBuyModuleService from "../../../modules/group-buy/service";

export type UpdateGroupBuyInput = {
  id: string;
  title?: string;
  min_quantity?: number;
  max_quantity?: number | null;
  ends_at?: Date;
  note?: string | null;
  status?: "open" | "cancelled";
};

export const updateGroupBuyStep = createStep(
  "update-group-buy",
  async (input: UpdateGroupBuyInput, { container }) => {
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    const before = await service.retrieveGroupBuy(input.id);
    const { id, ...rest } = input;
    const patch: Record<string, unknown> = { ...rest };
    if (input.status === "cancelled") patch.closed_at = new Date();
    if (input.status === "open") patch.closed_at = null;
    const updated = await service.updateGroupBuys({ id, ...patch } as any);
    return new StepResponse(updated, before);
  },
  async (before, { container }) => {
    if (!before) return;
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    await service.updateGroupBuys({
      id: before.id,
      title: before.title,
      min_quantity: before.min_quantity,
      max_quantity: before.max_quantity,
      ends_at: before.ends_at,
      note: before.note,
      status: before.status,
      closed_at: before.closed_at,
    } as any);
  }
);
