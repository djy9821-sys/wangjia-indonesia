import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchTracking } from "../../../../../utils/biteship";
import { assertOrderOwnedByCustomer } from "../../../payment-plans/utils";

/*
  GET /store/orders/:id/tracking — shipments with live carrier history
  (Biteship) when configured; otherwise the numbers and links as entered.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await assertOrderOwnedByCustomer(req.scope, req.params.id, req.auth_context.actor_id);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "fulfillments.id",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
      "fulfillments.shipping_option.name",
      "fulfillments.shipping_option.metadata",
    ],
    filters: { id: req.params.id },
  });

  const shipments = await Promise.all(
    (order?.fulfillments ?? []).map(async (f: any) => ({
      id: f.id,
      shipped_at: f.shipped_at,
      delivered_at: f.delivered_at,
      canceled_at: f.canceled_at,
      shipping_option: f.shipping_option?.name ?? null,
      labels: await Promise.all(
        (f.labels ?? [])
          .filter((l: any) => l.tracking_number)
          .map((l: any) =>
            fetchTracking(
              req.scope,
              l.tracking_number,
              l.tracking_url ?? null,
              f.shipping_option?.metadata?.biteship_courier ?? null
            )
          )
      ),
    }))
  );

  res.json({ shipments });
};
