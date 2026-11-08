import { MedusaService } from "@medusajs/framework/utils";
import { GroupBuy, GroupBuyOrder } from "./models";

export type GroupBuyProgress = { joined_quantity: number; participants: number };

class GroupBuyModuleService extends MedusaService({ GroupBuy, GroupBuyOrder }) {
  /** Joined quantity and participant count per group buy id. */
  async progressFor(ids: string[]): Promise<Record<string, GroupBuyProgress>> {
    const out: Record<string, GroupBuyProgress> = {};
    for (const id of ids) out[id] = { joined_quantity: 0, participants: 0 };
    if (!ids.length) return out;
    const rows = await this.listGroupBuyOrders({ group_buy_id: ids, status: "joined" } as any, { take: 10000 });
    const seen = new Map<string, Set<string>>();
    for (const r of rows) {
      const p = out[r.group_buy_id];
      p.joined_quantity += Number(r.quantity);
      const who = r.customer_id ?? r.order_id;
      const set = seen.get(r.group_buy_id) ?? new Set<string>();
      set.add(who);
      seen.set(r.group_buy_id, set);
      p.participants = set.size;
    }
    return out;
  }
}

export default GroupBuyModuleService;
