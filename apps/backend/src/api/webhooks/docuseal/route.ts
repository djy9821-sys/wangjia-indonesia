import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";

/*
  POST /webhooks/docuseal — DocuSeal "form.completed" / "submission.completed"
  events. The contract template carries an `order_id` (submission metadata or
  the submitter's external_id); when every signer is done, the order's
  metadata records the signed PDF so sales and finance see it on the order.
  Configure the secret header X-Docuseal-Secret in DocuSeal's webhook settings.
*/
type DocusealEvent = {
  event_type?: string;
  data?: {
    id?: number | string;
    status?: string;
    external_id?: string | null;
    metadata?: Record<string, unknown> | null;
    audit_log_url?: string | null;
    documents?: { name?: string; url?: string }[];
    submission?: { id?: number | string; status?: string; metadata?: Record<string, unknown> | null; audit_log_url?: string | null };
  };
};

export const POST = async (req: MedusaRequest<DocusealEvent>, res: MedusaResponse) => {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (!secret) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "DocuSeal webhook not configured");
  }
  if (req.headers["x-docuseal-secret"] !== secret) {
    return res.status(401).json({ message: "bad secret" });
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const body = req.body ?? {};
  const data = body.data ?? {};
  const meta = { ...(data.submission?.metadata ?? {}), ...(data.metadata ?? {}) } as Record<string, unknown>;
  const orderId = (meta.order_id as string | undefined) ?? data.external_id ?? null;
  const completed =
    body.event_type === "submission.completed" ||
    (body.event_type === "form.completed" && (data.submission?.status ?? data.status) === "completed");

  if (!orderId || !completed) {
    return res.json({ received: true, applied: false });
  }

  const orderService = req.scope.resolve(Modules.ORDER);
  const order = await orderService.retrieveOrder(orderId).catch(() => null);
  if (!order) {
    logger.warn(`[docuseal] unknown order ${orderId}`);
    return res.json({ received: true, applied: false });
  }
  const signed = (data.documents ?? []).map((d) => d.url).filter(Boolean) as string[];
  await orderService.updateOrders([
    {
      id: order.id,
      metadata: {
        ...(order.metadata ?? {}),
        contract_signed_at: new Date().toISOString(),
        contract_submission_id: String(data.submission?.id ?? data.id ?? ""),
        contract_documents: signed,
        contract_audit_log: data.submission?.audit_log_url ?? data.audit_log_url ?? null,
      },
    },
  ]);
  logger.info(`[docuseal] order ${order.id}: contract signed (${signed.length} file(s))`);
  res.json({ received: true, applied: true });
};
