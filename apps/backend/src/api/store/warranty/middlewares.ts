import { authenticate, validateAndTransformBody } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { StoreRegisterWarranty } from "../../admin/warranty/validators";

/* verify/:code stays public (publishable key only): anyone can scan a label. */
export const storeWarrantyMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/warranty/register",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreRegisterWarranty),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/warranty/units",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
];
