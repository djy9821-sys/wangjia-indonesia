import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { GROUP_BUY_MODULE } from "../../../../modules/group-buy";
import GroupBuyModuleService from "../../../../modules/group-buy/service";
import { summarizeGroupBuys } from "../../../../utils/group-buy";

/* GET /store/group-buys/:id */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const gb = await service.retrieveGroupBuy(req.params.id).catch(() => null);
  if (!gb) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Patungan tidak ditemukan.");
  const [summary] = await summarizeGroupBuys(req.scope, [gb]);
  res.json({ group_buy: summary });
};
