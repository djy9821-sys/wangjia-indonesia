import { authenticate } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

export const storeAccountMiddlewares: MiddlewareRoute[] = [
  {
    method: ["DELETE"],
    matcher: "/store/account",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
];
