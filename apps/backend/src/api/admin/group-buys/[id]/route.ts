import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { GROUP_BUY_MODULE } from "../../../../modules/group-buy";
import GroupBuyModuleService from "../../../../modules/group-buy/service";
import { summarizeGroupBuys } from "../../../../utils/group-buy";
import { updateGroupBuyWorkflow } from "../../../../workflows/group-buy/workflows/update-group-buy";
import { AdminUpdateGroupBuy } from "../validators";

/* GET /admin/group-buys/:id — the group buy plus the orders that joined it. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const gb = await service.retrieveGroupBuy(req.params.id).catch(() => null);
  if (!gb) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Group buy not found");
  const [summary] = await summarizeGroupBuys(req.scope, [gb]);
  const rows = await service.listGroupBuyOrders({ group_buy_id: gb.id } as any, { order: { created_at: "ASC" }, take: 1000 });
  const { data: orders } = rows.length
    ? await query.graph({
        entity: "order",
        fields: ["id", "display_id", "status", "total", "customer.first_name", "customer.last_name", "customer.phone"],
        filters: { id: rows.map((r) => r.order_id) },
      })
    : { data: [] as any[] };
  const byId = new Map<string, any>(orders.map((o: any) => [o.id, o] as [string, any]));
  res.json({
    group_buy: summary,
    orders: rows.map((r) => {
      const o = byId.get(r.order_id);
      return {
        id: r.id,
        order_id: r.order_id,
        display_id: o?.display_id ?? null,
        order_status: o?.status ?? null,
        total: o?.total ?? null,
        customer_name: o ? [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ") : null,
        customer_phone: o?.customer?.phone ?? null,
        quantity: Number(r.quantity),
        status: r.status,
        created_at: r.created_at,
      };
    }),
  });
};

/* POST /admin/group-buys/:id — edit terms or cancel. */
export const POST = async (req: AuthenticatedMedusaRequest<AdminUpdateGroupBuy>, res: MedusaResponse) => {
  const { result } = await updateGroupBuyWorkflow(req.scope).run({ input: { id: req.params.id, ...req.validatedBody } });
  const [summary] = await summarizeGroupBuys(req.scope, [result]);
  res.json({ group_buy: summary });
};
