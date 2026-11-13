import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/*
  A deleted account's JWT stays cryptographically valid until it expires, so
  every store request made as a customer is checked against the customer
  record, where the deletion workflow leaves metadata.deleted_at. The answer
  is kept in the cache for a few minutes so the lookup stays rare; the
  deletion workflow writes "deleted" there at once.
*/
export const deletedCustomerCacheKey = (customerId: string) => `deleted-customer:${customerId}`;
export const CUSTOMER_CHECK_TTL_SECONDS = 10 * 60;

export const rejectDeletedCustomer = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const ctx = req.auth_context;
  if (ctx?.actor_type === "customer" && ctx.actor_id) {
    const cache = req.scope.resolve(Modules.CACHE);
    const key = deletedCustomerCacheKey(ctx.actor_id);
    let deleted = await cache.get<boolean>(key).catch(() => null);
    if (typeof deleted !== "boolean") {
      try {
        const [customer] = await req.scope
          .resolve(Modules.CUSTOMER)
          .listCustomers({ id: ctx.actor_id }, { select: ["id", "metadata"] });
        deleted = !customer || !!customer.metadata?.deleted_at;
      } catch {
        // The lookup failed, not the login: a 401 here would sign the customer out of the app.
        return next();
      }
      await cache.set(key, deleted, CUSTOMER_CHECK_TTL_SECONDS).catch(() => undefined);
    }
    if (deleted) {
      return res.status(401).json({ type: "unauthorized", message: "Akun ini sudah dihapus." });
    }
  }
  return next();
};
