import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { deleteCustomerAccountWorkflow } from "../../../workflows/account/workflows/delete-customer-account";

/* DELETE /store/account — the signed-in customer deletes their own account. */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteCustomerAccountWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      auth_identity_id: req.auth_context.auth_identity_id ?? null,
    },
  });
  res.json({ deleted: true });
};
