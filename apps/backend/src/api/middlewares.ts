import { allowFields, errorHandler } from "@medusajs/framework/http";
import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { defineMiddlewares } from "@medusajs/medusa";
import { captureServerError } from "../utils/sentry";
import { rejectDeletedCustomer } from "./middlewares/reject-deleted-customer";
import { adminMiddlewares } from "./admin/middlewares";
import { storeMiddlewares } from "./store/middlewares";
import {
  authRateLimit,
  otpRateLimit,
  signupRateLimit,
  uploadRateLimit,
  verifyRateLimit,
} from "./middlewares/rate-limit";

/* Medusa's own error handler (status mapping, logging); we only add reporting. */
const defaultErrorHandler = errorHandler();

export default defineMiddlewares({
  errorHandler: (error: unknown, req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    captureServerError(error, { method: req.method, url: req.originalUrl });
    return defaultErrorHandler(error, req, res, next);
  },
  routes: [
    // Abuse protection first, so it runs before validation and handlers.
    { matcher: "/auth/*", method: ["POST"], middlewares: [authRateLimit] },
    { matcher: "/store/otp/*", method: ["POST"], middlewares: [otpRateLimit] },
    { matcher: "/store/customers", method: ["POST"], middlewares: [signupRateLimit] },
    { matcher: "/store/quotes", method: ["POST"], middlewares: [signupRateLimit] },
    { matcher: "/store/payment-installments/:id/proofs", method: ["POST"], middlewares: [uploadRateLimit] },
    { matcher: "/store/warranty/verify/*", method: ["GET"], middlewares: [verifyRateLimit] },
    { matcher: "/store/warranty/register", method: ["POST"], middlewares: [uploadRateLimit] },
    ...adminMiddlewares,
    ...storeMiddlewares,
    // After the route's own authenticate() so auth_context is populated.
    { matcher: "/store/*", middlewares: [rejectDeletedCustomer] },
    {
      matcher: "/store/customers/me",
      middlewares: [allowFields("employee")],
    },
    {
      matcher: "/store/carts",
      middlewares: [
        allowFields(
          "company",
          "company.approval_settings",
          "approvals",
          "approval_status"
        ),
      ],
    },
  ],
});
