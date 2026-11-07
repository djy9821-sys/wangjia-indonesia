import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";

/*
  GET /health/deep — for Uptime Kuma. Unlike /health (process alive) this
  proves the database answers and the cache round-trips, and reports how long
  each took so a slow disk or full Redis shows up before customers notice.
*/
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const checks: Record<string, { ok: boolean; ms: number; error?: string }> = {};

  const time = async (name: string, fn: () => Promise<unknown>) => {
    const t0 = Date.now();
    try {
      await fn();
      checks[name] = { ok: true, ms: Date.now() - t0 };
    } catch (e) {
      checks[name] = { ok: false, ms: Date.now() - t0, error: (e as Error).message };
    }
  };

  await time("database", async () => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1, skip: 0 } });
  });
  await time("cache", async () => {
    const cache = req.scope.resolve(Modules.CACHE);
    const key = `health:${Date.now()}`;
    await cache.set(key, 1, 10);
    if ((await cache.get(key)) !== 1) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "cache read-back failed");
    }
  });

  const ok = Object.values(checks).every((c) => c.ok);
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    checks,
    version: process.env.SENTRY_RELEASE ?? null,
    time: new Date().toISOString(),
  });
};
