import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  assertInstallmentOwnedByCustomer,
  retrieveStorePaymentPlan,
} from "../../payment-plans/utils";

/*
  Lets the app poll one installment (e.g. after returning from Midtrans).
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id;
  const installment = await assertInstallmentOwnedByCustomer(
    req.scope,
    req.params.id,
    customerId
  );

  const plan = await retrieveStorePaymentPlan(req.scope, {
    id: installment.plan_id,
  });
  const full = plan?.installments?.find((i: any) => i.id === installment.id);

  res.json({ installment: full ?? installment, payment_plan: plan });
};
