import { MedusaContainer } from "@medusajs/framework/types";
import { GROUP_BUY_MODULE } from "../modules/group-buy";
import GroupBuyModuleService from "../modules/group-buy/service";

export type GroupBuySummary = {
  id: string;
  title: string;
  product_id: string;
  product_handle: string | null;
  product_title: string;
  variant_id: string;
  variant_title: string | null;
  thumbnail: string | null;
  currency_code: string;
  group_price: number;
  regular_price: number | null;
  min_quantity: number;
  max_quantity: number | null;
  joined_quantity: number;
  participants: number;
  remaining_quantity: number | null;
  ends_at: string;
  status: "open" | "success" | "failed" | "cancelled";
  note: string | null;
  created_at: string;
};

/** Group buys with their live progress, in the shape both storefront and app render. */
export async function summarizeGroupBuys(container: MedusaContainer, groupBuys: any[]): Promise<GroupBuySummary[]> {
  const service = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const progress = await service.progressFor(groupBuys.map((g) => g.id));
  return groupBuys.map((g) => {
    const p = progress[g.id] ?? { joined_quantity: 0, participants: 0 };
    return {
      id: g.id,
      title: g.title,
      product_id: g.product_id,
      product_handle: g.product_handle ?? null,
      product_title: g.product_title,
      variant_id: g.variant_id,
      variant_title: g.variant_title ?? null,
      thumbnail: g.thumbnail ?? null,
      currency_code: g.currency_code,
      group_price: Number(g.group_price),
      regular_price: g.regular_price == null ? null : Number(g.regular_price),
      min_quantity: Number(g.min_quantity),
      max_quantity: g.max_quantity == null ? null : Number(g.max_quantity),
      joined_quantity: p.joined_quantity,
      participants: p.participants,
      remaining_quantity: g.max_quantity == null ? null : Math.max(0, Number(g.max_quantity) - p.joined_quantity),
      ends_at: new Date(g.ends_at).toISOString(),
      status: g.status,
      note: g.note ?? null,
      created_at: new Date(g.created_at).toISOString(),
    };
  });
}

export const isGroupBuyJoinable = (g: { status: string; ends_at: Date | string }, now = new Date()) =>
  g.status === "open" && new Date(g.ends_at).getTime() > now.getTime();
