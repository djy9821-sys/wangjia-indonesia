import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { GROUP_BUY_MODULE } from "../../../modules/group-buy";
import GroupBuyModuleService from "../../../modules/group-buy/service";
import { summarizeGroupBuys } from "../../../utils/group-buy";
import { createGroupBuyWorkflow } from "../../../workflows/group-buy/workflows/create-group-buy";
import { AdminCreateGroupBuy, AdminListGroupBuys } from "./validators";

/* GET /admin/group-buys?status= — newest first, with progress. */
export const GET = async (req: AuthenticatedMedusaRequest<unknown, AdminListGroupBuys>, res: MedusaResponse) => {
  const service = req.scope.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const status = req.validatedQuery?.status ?? "all";
  const list = await service.listGroupBuys(status === "all" ? {} : ({ status } as any), {
    order: { created_at: "DESC" },
    take: 200,
  });
  res.json({ group_buys: await summarizeGroupBuys(req.scope, list) });
};

/* POST /admin/group-buys — start a patungan for one variant. */
export const POST = async (req: AuthenticatedMedusaRequest<AdminCreateGroupBuy>, res: MedusaResponse) => {
  const { result } = await createGroupBuyWorkflow(req.scope).run({
    input: { ...req.validatedBody, created_by: req.auth_context.actor_id },
  });
  const [summary] = await summarizeGroupBuys(req.scope, [result]);
  res.status(201).json({ group_buy: summary });
};
