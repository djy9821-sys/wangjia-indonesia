import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { releasePaymentPlanWorkflow } from "../../../../../workflows/payment-plan/workflows";
import { paymentPlanFields } from "../../query-config";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await releasePaymentPlanWorkflow(req.scope).run({
    input: {
      plan_id: req.params.id,
      actor_id: req.auth_context?.actor_id ?? null,
    },
  });

  const {
    data: [plan],
  } = await query.graph(
    {
      entity: "payment_plan",
      fields: paymentPlanFields,
      filters: { id: result.plan_id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ payment_plan: plan, release: result });
};
