import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { rejectPaymentProofWorkflow } from "../../../../../workflows/payment-plan/workflows";
import { paymentPlanFields } from "../../../payment-plans/query-config";
import { AdminRejectProofType } from "../../../payment-plans/validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectProofType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await rejectPaymentProofWorkflow(req.scope).run({
    input: {
      proof_id: req.params.id,
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
      filters: { id: result.installment?.plan_id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ payment_plan: plan });
};
