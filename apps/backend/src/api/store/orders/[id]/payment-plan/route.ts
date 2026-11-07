import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  assertOrderOwnedByCustomer,
  retrieveStorePaymentPlan,
} from "../../../payment-plans/utils";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id;
  await assertOrderOwnedByCustomer(req.scope, req.params.id, customerId);

  const plan = await retrieveStorePaymentPlan(req.scope, {
    order_id: req.params.id,
  });

  res.json({ payment_plan: plan });
};
