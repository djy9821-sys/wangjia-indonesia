import { authenticate, validateAndTransformBody } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { StoreCreateMidtrans, StoreSubmitPaymentProof } from "./validators";

export const storePaymentPlansMiddlewares: MiddlewareRoute[] = [
  // Region lookups are public reference data (no customer login needed).
  {
    method: "ALL",
    matcher: "/store/orders/:id/payment-plan",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: "ALL",
    matcher: "/store/orders/:id/shipments",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: "ALL",
    matcher: "/store/orders/:id/invoice-link",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: "ALL",
    matcher: "/store/payment-installments*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/payment-installments/:id/proofs",
    // Receipts arrive as base64 JSON from the app; allow a few MB.
    bodyParser: { sizeLimit: "12mb" },
    middlewares: [validateAndTransformBody(StoreSubmitPaymentProof)],
  },
  {
    method: ["POST"],
    matcher: "/store/payment-installments/:id/midtrans",
    middlewares: [validateAndTransformBody(StoreCreateMidtrans)],
  },
];
