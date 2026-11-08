import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { GROUP_BUY_MODULE } from "../../../modules/group-buy";
import GroupBuyModuleService from "../../../modules/group-buy/service";
import { summarizeGroupBuys } from "../../../utils/group-buy";
import { StoreListGroupBuys } from "./validators";

/* GET /store/group-buys — open patungan (default) with live progress. */
export const GET = async (req: MedusaRequest<unknown, StoreListGroupBuys>, res: MedusaResponse) => {
  const service = req.scope.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const status = req.validatedQuery?.status ?? "open";
  const filters: Record<string, unknown> = {};
  if (status !== "all") filters.status = status;
  if (status === "open") filters.ends_at = { $gt: new Date() };
  if (req.validatedQuery?.product_id) filters.product_id = req.validatedQuery.product_id;
  const list = await service.listGroupBuys(filters as any, { order: { ends_at: "ASC" }, take: 50 });
  res.json({ group_buys: await summarizeGroupBuys(req.scope, list) });
};
