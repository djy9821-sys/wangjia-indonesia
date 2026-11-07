import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { assertOrderOwnedByCustomer } from "../../../payment-plans/utils";

/*
  Shipment tracking for the app. The built-in store order endpoint does not
  expose fulfillment labels, so this returns each fulfillment with its
  freight tracking numbers.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id;
  await assertOrderOwnedByCustomer(req.scope, req.params.id, customerId);

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "fulfillments.id",
      "fulfillments.packed_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.created_at",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
      "fulfillments.shipping_option.name",
    ],
    filters: { id: req.params.id },
  });

  res.json({ shipments: order?.fulfillments ?? [] });
};
