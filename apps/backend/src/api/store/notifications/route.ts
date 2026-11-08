import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/*
  GET /store/notifications — the customer's message history (what we sent by
  WhatsApp / email), so a missed push is never lost. One entry per message:
  the WhatsApp and email copies of the same text are collapsed.
*/
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "notification",
    fields: ["id", "channel", "template", "data", "created_at", "status"],
    filters: { receiver_id: req.auth_context.actor_id, channel: ["whatsapp", "email"] },
    pagination: { order: { created_at: "DESC" }, take: 200, skip: 0 },
  });

  const seen = new Set<string>();
  const items = (data as any[])
    .filter((n) => {
      const d = (n.data ?? {}) as Record<string, unknown>;
      const key = `${n.template}:${String(d.text ?? "").slice(0, 80)}:${new Date(n.created_at).toISOString().slice(0, 16)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 100)
    .map((n) => {
      const d = (n.data ?? {}) as Record<string, unknown>;
      return {
        id: n.id,
        template: n.template,
        title: (d.subject as string | undefined) ?? null,
        text: (d.text as string | undefined) ?? "",
        order_id: (d.order_id as string | undefined) ?? null,
        warranty_unit_id: (d.warranty_unit_id as string | undefined) ?? null,
        group_buy_id: (d.group_buy_id as string | undefined) ?? null,
        created_at: n.created_at,
      };
    });
  res.json({ notifications: items });
};
