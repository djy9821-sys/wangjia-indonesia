import { Modules } from "@medusajs/framework/utils";
import {
  CUSTOMER_CHECK_TTL_SECONDS,
  deletedCustomerCacheKey,
  rejectDeletedCustomer,
} from "../reject-deleted-customer";

const key = deletedCustomerCacheKey("cus_1");
const customer = { actor_type: "customer", actor_id: "cus_1" };

/*
  A stand-in backend: a cache holding `cached`, and a customer module that
  answers a lookup with `records`. Either can be made to fail.
*/
const backend = ({
  cached = {} as Record<string, unknown>,
  records = [] as { id: string; metadata: Record<string, unknown> | null }[],
  cacheDown = false,
  lookupDown = false,
} = {}) => {
  const kept = new Map(Object.entries(cached));
  const cache = {
    get: jest.fn(async (k: string) => (cacheDown ? Promise.reject("cache down") : kept.get(k) ?? null)),
    set: jest.fn(async (k: string, value: unknown, _ttl: number) =>
      cacheDown ? Promise.reject("cache down") : void kept.set(k, value)
    ),
  };
  const listCustomers = jest.fn(async () => (lookupDown ? Promise.reject("database down") : records));
  const scope = { resolve: (name: string) => (name === Modules.CACHE ? cache : { listCustomers }) };

  /* Sends one store request; true when it was let through, false when refused with a 401. */
  const request = async (auth_context?: Record<string, unknown>) => {
    const next = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await rejectDeletedCustomer({ auth_context, scope } as any, res as any, next);
    if (next.mock.calls.length) {
      expect(res.status).not.toHaveBeenCalled();
      return true;
    }
    expect(res.status).toHaveBeenCalledWith(401);
    return false;
  };
  return { request, cache, listCustomers };
};

describe("rejectDeletedCustomer", () => {
  it("lets a customer through and remembers the answer for a while", async () => {
    const { request, cache, listCustomers } = backend({ records: [{ id: "cus_1", metadata: null }] });
    expect(await request(customer)).toBe(true);
    expect(listCustomers).toHaveBeenCalledWith({ id: "cus_1" }, { select: ["id", "metadata"] });
    expect(cache.set).toHaveBeenCalledWith(key, false, CUSTOMER_CHECK_TTL_SECONDS);
    expect(await request(customer)).toBe(true);
    expect(listCustomers).toHaveBeenCalledTimes(1);
  });

  it("refuses a deleted account as soon as the deletion has marked it", async () => {
    const { request, listCustomers } = backend({ cached: { [key]: true } });
    expect(await request(customer)).toBe(false);
    expect(listCustomers).not.toHaveBeenCalled();
  });

  it("still refuses it when the cache has forgotten: the record says so", async () => {
    const { request, cache } = backend({
      records: [{ id: "cus_1", metadata: { deleted_at: "2026-11-13T02:00:00.000Z" } }],
    });
    expect(await request(customer)).toBe(false);
    expect(cache.set).toHaveBeenCalledWith(key, true, CUSTOMER_CHECK_TTL_SECONDS);
  });

  it("refuses a login whose customer record no longer exists", async () => {
    const { request } = backend({ records: [] });
    expect(await request(customer)).toBe(false);
  });

  it("a lookup that fails is not a refusal, and is not remembered", async () => {
    const { request, cache } = backend({ lookupDown: true });
    expect(await request(customer)).toBe(true);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("works from the record alone while the cache is down", async () => {
    const deleted = backend({ cacheDown: true, records: [{ id: "cus_1", metadata: { deleted_at: "2026-11-13" } }] });
    expect(await deleted.request(customer)).toBe(false);
    const present = backend({ cacheDown: true, records: [{ id: "cus_1", metadata: {} }] });
    expect(await present.request(customer)).toBe(true);
  });

  it("leaves guests, unfinished sign-ups and staff alone", async () => {
    const { request, cache, listCustomers } = backend({ cached: { [key]: true } });
    expect(await request(undefined)).toBe(true);
    expect(await request({ actor_type: "customer", actor_id: "" })).toBe(true);
    expect(await request({ actor_type: "user", actor_id: "cus_1" })).toBe(true);
    expect(cache.get).not.toHaveBeenCalled();
    expect(listCustomers).not.toHaveBeenCalled();
  });
});
