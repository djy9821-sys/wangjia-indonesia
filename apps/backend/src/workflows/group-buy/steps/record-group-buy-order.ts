import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { GROUP_BUY_MODULE } from "../../../modules/group-buy";
import GroupBuyModuleService from "../../../modules/group-buy/service";

export type RecordGroupBuyOrderInput = {
  group_buy_id: string;
  order_id: string;
  customer_id?: string | null;
  quantity: number;
};

/* Upserts the (group buy, order) participation row. */
export const recordGroupBuyOrderStep = createStep(
  "record-group-buy-order",
  async (input: RecordGroupBuyOrderInput, { container }) => {
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    const [existing] = await service.listGroupBuyOrders(
      { group_buy_id: input.group_buy_id, order_id: input.order_id } as any,
      { take: 1 }
    );
    let result: { id: string; created: boolean };
    let compensation: { id: string; previous: { quantity: number; status: string } | null };
    if (existing) {
      await service.updateGroupBuyOrders({ id: existing.id, quantity: input.quantity, status: "joined" } as any);
      result = { id: existing.id, created: false };
      compensation = { id: existing.id, previous: { quantity: Number(existing.quantity), status: existing.status } };
    } else {
      const row = await service.createGroupBuyOrders({
        group_buy_id: input.group_buy_id,
        order_id: input.order_id,
        customer_id: input.customer_id ?? null,
        quantity: input.quantity,
        status: "joined",
      });
      result = { id: row.id, created: true };
      compensation = { id: row.id, previous: null };
    }
    return new StepResponse(result, compensation);
  },
  async (ctx, { container }) => {
    if (!ctx) return;
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    if (ctx.previous) {
      await service.updateGroupBuyOrders({ id: ctx.id, quantity: ctx.previous.quantity, status: ctx.previous.status } as any);
    } else {
      await service.deleteGroupBuyOrders(ctx.id);
    }
  }
);

/* Marks an order's participations cancelled (order cancelled). */
export const cancelGroupBuyOrdersStep = createStep(
  "cancel-group-buy-orders",
  async (input: { order_id: string }, { container }) => {
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    const rows = await service.listGroupBuyOrders({ order_id: input.order_id, status: "joined" } as any, { take: 100 });
    if (rows.length) {
      await service.updateGroupBuyOrders(rows.map((r) => ({ id: r.id, status: "cancelled" })) as any);
    }
    return new StepResponse(rows.map((r) => r.group_buy_id), rows.map((r) => r.id));
  },
  async (ids, { container }) => {
    if (!ids?.length) return;
    const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    await service.updateGroupBuyOrders(ids.map((id) => ({ id, status: "joined" })) as any);
  }
);
