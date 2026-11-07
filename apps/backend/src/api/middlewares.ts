import { allowFields } from "@medusajs/framework/http";
import { defineMiddlewares } from "@medusajs/medusa";
import { adminMiddlewares } from "./admin/middlewares";
import { storeMiddlewares } from "./store/middlewares";
import {
  authRateLimit,
  otpRateLimit,
  signupRateLimit,
  uploadRateLimit,
} from "./middlewares/rate-limit";

export default defineMiddlewares({
  routes: [
    // Abuse protection first, so it runs before validation and handlers.
    { matcher: "/auth/*", method: ["POST"], middlewares: [authRateLimit] },
    { matcher: "/store/otp/*", method: ["POST"], middlewares: [otpRateLimit] },
    { matcher: "/store/customers", method: ["POST"], middlewares: [signupRateLimit] },
    { matcher: "/store/quotes", method: ["POST"], middlewares: [signupRateLimit] },
    { matcher: "/store/payment-installments/:id/proofs", method: ["POST"], middlewares: [uploadRateLimit] },
    ...adminMiddlewares,
    ...storeMiddlewares,
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
