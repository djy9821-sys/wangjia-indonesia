import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { GROUP_BUY_MODULE } from "../../../modules/group-buy";
import GroupBuyModuleService from "../../../modules/group-buy/service";

export type EvaluateGroupBuyResult = {
  id: string;
  status: "open" | "success" | "failed" | "cancelled";
  changed: boolean;
  joined_quantity: number;
};

/*
  Re-derives an open group buy's status from its joined quantity and deadline.
  Success wins over expiry when both hold (orders placed before the deadline).
*/
export const evaluateGroupBuyStep = createStep(
  "evaluate-group-buy",
  async (input: { group_buy_id: string; now?: Date }, { container }) => {
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    const gb = await service.retrieveGroupBuy(input.group_buy_id);
    const { joined_quantity } = (await service.progressFor([gb.id]))[gb.id];
    const now = input.now ?? new Date();
    let next = gb.status as EvaluateGroupBuyResult["status"];
    if (gb.status === "open") {
      if (joined_quantity >= Number(gb.min_quantity)) next = "success";
      else if (new Date(gb.ends_at).getTime() <= now.getTime()) next = "failed";
    }
    const changed = next !== gb.status;
    if (changed) {
      await service.updateGroupBuys({ id: gb.id, status: next, closed_at: now } as any);
    }
    return new StepResponse(
      { id: gb.id, status: next, changed, joined_quantity } satisfies EvaluateGroupBuyResult,
      changed ? { id: gb.id, status: gb.status, closed_at: gb.closed_at } : null
    );
  },
  async (prev, { container }) => {
    if (!prev) return;
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    await service.updateGroupBuys({ id: prev.id, status: prev.status, closed_at: prev.closed_at } as any);
  }
);

/* Flips every open group buy whose deadline passed to failed; returns their ids. */
export const expireGroupBuysStep = createStep(
  "expire-group-buys",
  async (input: { now?: Date }, { container }) => {
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    const now = input.now ?? new Date();
    const open = await service.listGroupBuys({ status: "open", ends_at: { $lte: now } } as any, { take: 500 });
    if (!open.length) return new StepResponse({ failed: [] as string[], succeeded: [] as string[] }, []);
    const progress = await service.progressFor(open.map((g) => g.id));
    const succeeded = open.filter((g) => progress[g.id].joined_quantity >= Number(g.min_quantity)).map((g) => g.id);
    const failed = open.filter((g) => !succeeded.includes(g.id)).map((g) => g.id);
    if (succeeded.length) await service.updateGroupBuys(succeeded.map((id) => ({ id, status: "success", closed_at: now })) as any);
    if (failed.length) await service.updateGroupBuys(failed.map((id) => ({ id, status: "failed", closed_at: now })) as any);
    return new StepResponse({ failed, succeeded }, [...failed, ...succeeded]);
  },
  async (ids, { container }) => {
    if (!ids?.length) return;
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    await service.updateGroupBuys(ids.map((id) => ({ id, status: "open", closed_at: null })) as any);
  }
);
