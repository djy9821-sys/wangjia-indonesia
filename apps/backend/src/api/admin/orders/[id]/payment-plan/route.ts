import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { signProofUrlsIn } from "../../../../../utils/proof-files";
import { createPaymentPlanWorkflow } from "../../../../../workflows/payment-plan/workflows";
import { AdminCreatePaymentPlanType } from "../../../payment-plans/validators";
import { pickCurrentPlan } from "../../../payment-plans/utils";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: plans } = await query.graph({
    entity: "payment_plan",
    fields: req.queryConfig.fields,
    filters: { order_id: req.params.id },
  });

  const current = pickCurrentPlan(plans as any[]);
  res.json({ payment_plan: current ? await signProofUrlsIn(req.scope, current) : null });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePaymentPlanType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await createPaymentPlanWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      created_by: req.auth_context?.actor_id ?? null,
      ...req.validatedBody,
    },
  });

  const {
    data: [plan],
  } = await query.graph(
    {
      entity: "payment_plan",
      fields: req.queryConfig.fields,
      filters: { id: result.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.status(201).json({ payment_plan: await signProofUrlsIn(req.scope, plan) });
};
