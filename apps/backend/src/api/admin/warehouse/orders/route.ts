import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchOrdersById, fulfillmentProgress } from "../../payment-plans/utils";

/*
  Warehouse work queue: orders whose payment plan has been released by
  finance and that are not yet fully shipped.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: plans } = await query.graph({
    entity: "payment_plan",
    fields: [
      "id",
      "order_id",
      "release_policy",
      "status",
      "released_at",
      "released_by",
      "installments.sequence",
      "installments.label",
      "installments.status",
    ],
    filters: { released_at: { $ne: null } },
    pagination: { order: { released_at: "DESC" }, take: 200, skip: 0 },
  });

  const orders = await fetchOrdersById(
    req.scope,
    plans.map((p: any) => p.order_id)
  );

  const rows = plans
    .map((plan: any) => {
      const order = orders[plan.order_id];
      const progress = fulfillmentProgress(order);
      return { plan, order, progress };
    })
    .filter((r) => r.order && !r.progress.fully_shipped);

  res.json({ orders: rows, count: rows.length });
};
