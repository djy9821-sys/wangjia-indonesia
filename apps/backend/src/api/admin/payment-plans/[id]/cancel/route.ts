import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { signProofUrlsIn } from "../../../../../utils/proof-files";
import { cancelPaymentPlanWorkflow } from "../../../../../workflows/payment-plan/workflows";
import { paymentPlanFields } from "../../query-config";
import { AdminCancelPaymentPlanType } from "../../validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCancelPaymentPlanType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await cancelPaymentPlanWorkflow(req.scope).run({
    input: {
      plan_id: req.params.id,
      actor_id: req.auth_context?.actor_id ?? null,
      ...req.validatedBody,
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

  res.json({ payment_plan: await signProofUrlsIn(req.scope, plan), outstanding_refund: result.outstanding_refund });
};
