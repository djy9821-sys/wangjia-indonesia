import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleMidtransNotificationWorkflow } from "../../../workflows/payment-plan/workflows";
import {
  getTransactionStatus,
  MidtransNotification,
  midtransConfigured,
  verifyNotificationSignature,
} from "../../../utils/midtrans";

/*
  Midtrans HTTP notification endpoint. Configure it in the Midtrans dashboard:
    Settings -> Configuration -> Payment Notification URL
    https://<your-backend>/webhooks/midtrans

  Flow: verify the signature, re-fetch the status from Midtrans (never trust
  the pushed payload alone), then apply it to the installment.
*/
export const POST = async (
  req: MedusaRequest<MidtransNotification>,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const body = req.body;

  if (!midtransConfigured()) {
    return res.status(503).json({ message: "Midtrans not configured" });
  }

  if (!body?.order_id || !verifyNotificationSignature(body)) {
    logger.warn(`[midtrans] invalid signature for order_id=${body?.order_id}`);
    return res.status(403).json({ message: "Invalid signature" });
  }

  let notification: MidtransNotification = body;
  if (process.env.MIDTRANS_SKIP_STATUS_RECHECK !== "true") {
    try {
      notification = await getTransactionStatus(body.order_id);
    } catch (e) {
      logger.error(`[midtrans] status re-check failed: ${(e as Error).message}`);
      return res.status(502).json({ message: "Status re-check failed" });
    }
  }

  try {
    const { result } = await handleMidtransNotificationWorkflow(req.scope).run({
      input: notification,
    });
    logger.info(
      `[midtrans] ${notification.order_id} -> ${notification.transaction_status} (${result.mapped}), released=${result.released}`
    );
    return res.json({ received: true, ...result });
  } catch (e) {
    logger.error(`[midtrans] failed to apply notification: ${(e as Error).message}`);
    return res.status(500).json({ message: "Failed to process notification" });
  }
};
