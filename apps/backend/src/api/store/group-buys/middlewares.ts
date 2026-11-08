import { authenticate, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { StoreJoinGroupBuy, StoreListGroupBuys } from "./validators";

export const storeGroupBuysMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/group-buys",
    middlewares: [validateAndTransformQuery(StoreListGroupBuys, {})],
  },
  {
    method: ["POST"],
    matcher: "/store/group-buys/:id/join",
    middlewares: [authenticate("customer", ["session", "bearer"]), validateAndTransformBody(StoreJoinGroupBuy)],
  },
];
