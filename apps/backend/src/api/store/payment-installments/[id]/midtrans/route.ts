import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { createMidtransTransactionWorkflow } from "../../../../../workflows/payment-plan/workflows";
import { assertInstallmentOwnedByCustomer } from "../../../payment-plans/utils";
import { StoreCreateMidtransType } from "../../../payment-plans/validators";

/*
  Returns a Midtrans Snap token + redirect URL for one installment. The app
  opens the redirect URL (or uses the token with the Snap SDK).
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateMidtransType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id;
  const installment = await assertInstallmentOwnedByCustomer(
    req.scope,
    req.params.id,
    customerId
  );

  const { result } = await createMidtransTransactionWorkflow(req.scope).run({
    input: {
      installment_id: installment.id,
      finish_url: req.validatedBody.finish_url ?? null,
    },
  });

  res.json({
    token: result.token,
    redirect_url: result.redirect_url,
    gateway_order_id: result.gateway_order_id,
    client_key: process.env.MIDTRANS_CLIENT_KEY ?? null,
  });
};
