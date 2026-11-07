import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { confirmInstallmentWorkflow } from "../../../../../workflows/payment-plan/workflows";
import { paymentPlanFields } from "../../../payment-plans/query-config";
import { AdminConfirmInstallmentType } from "../../../payment-plans/validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminConfirmInstallmentType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await confirmInstallmentWorkflow(req.scope).run({
    input: {
      installment_id: req.params.id,
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

  res.json({ payment_plan: plan, release: result });
};
