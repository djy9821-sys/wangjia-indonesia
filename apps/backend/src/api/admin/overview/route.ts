import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/*
  GET /admin/overview — the numbers 李总 and the team look at every morning.
*/
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const now = Date.now();

  const { data: installments } = await query.graph({
    entity: "payment_installment",
    fields: ["id", "status", "amount", "due_date", "paid_at", "plan.status", "plan.released_at", "plan.order_id"],
    pagination: { take: 5000, skip: 0 },
  });
  const active = (installments as any[]).filter((i) => i.plan?.status === "active");
  const awaiting = active.filter((i) => i.status === "awaiting_confirmation");
  const overdue = active.filter((i) => i.status === "unpaid" && i.due_date && new Date(i.due_date).getTime() < now);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const receivedThisMonth = (installments as any[])
    .filter((i) => (i.status === "paid" || i.status === "refunded") && i.paid_at && new Date(i.paid_at) >= monthStart)
    .reduce((s, i) => s + Number(i.amount), 0);

  const { data: plans } = await query.graph({
    entity: "payment_plan",
    fields: ["id", "order_id", "released_at", "status"],
    filters: { released_at: { $ne: null }, status: ["active", "completed"] },
    pagination: { take: 2000, skip: 0 },
  });
  let toShip = 0;
  if (plans.length) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "items.quantity", "items.detail.shipped_quantity"],
      filters: { id: plans.map((p: any) => p.order_id) },
    });
    toShip = (orders as any[]).filter((o) => {
      const ordered = (o.items ?? []).reduce((s: number, it: any) => s + Number(it.quantity ?? 0), 0);
      const shipped = (o.items ?? []).reduce((s: number, it: any) => s + Number(it.detail?.shipped_quantity ?? 0), 0);
      return ordered > 0 && shipped < ordered;
    }).length;
  }

  const { data: quotes } = await query.graph({
    entity: "quote",
    fields: ["id", "status"],
    filters: { status: "pending_merchant" },
    pagination: { take: 1000, skip: 0 },
  });

  const { data: units } = await query.graph({
    entity: "warranty_unit",
    fields: ["id", "status", "registered_at", "scan_count"],
    pagination: { take: 10000, skip: 0 },
  });
  const registered = (units as any[]).filter((u) => u.status === "registered");
  const registeredThisMonth = registered.filter((u) => u.registered_at && new Date(u.registered_at) >= monthStart).length;
  const suspicious = (units as any[]).filter((u) => u.status !== "void" && Number(u.scan_count ?? 0) > 5).length;

  res.json({
    warranty: { registered: registered.length, registered_this_month: registeredThisMonth, suspicious },
    awaiting_confirmation: { count: awaiting.length, amount: awaiting.reduce((s, i) => s + Number(i.amount), 0) },
    overdue: { count: overdue.length, amount: overdue.reduce((s, i) => s + Number(i.amount), 0) },
    to_ship: { count: toShip },
    quotes_pending: { count: quotes.length },
    received_this_month: { amount: receivedThisMonth },
  });
};
