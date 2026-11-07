import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/*
  A deleted account's JWT stays cryptographically valid until it expires, so
  the deletion workflow records the customer id in the cache and every store
  request from that id is refused from then on. Cache lookup only, no DB.
*/
export const deletedCustomerCacheKey = (customerId: string) => `deleted-customer:${customerId}`;
export const DELETED_CUSTOMER_TTL_SECONDS = 3 * 24 * 3600; // longer than the JWT lifetime

export const rejectDeletedCustomer = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const ctx = req.auth_context;
  if (ctx?.actor_type === "customer" && ctx.actor_id) {
    const cache = req.scope.resolve(Modules.CACHE);
    const gone = await cache.get(deletedCustomerCacheKey(ctx.actor_id)).catch(() => null);
    if (gone) {
      return res.status(401).json({ type: "unauthorized", message: "Akun ini sudah dihapus." });
    }
  }
  return next();
};
