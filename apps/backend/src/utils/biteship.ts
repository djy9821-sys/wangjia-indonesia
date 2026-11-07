import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/*
  Shipment tracking through Biteship (aggregator for JNE, J&T, SiCepat,
  Anteraja, Pos, Lion Parcel, cargo lines, etc.). Optional: without
  BITESHIP_API_KEY the app just shows the tracking number and link.

  Warehouse enters the label as "<courier>:<waybill>" (e.g. jne:JP0123456789)
  when marking an order shipped; the shipping option metadata
  `biteship_courier` is the fallback courier code.
*/
export type TrackingEvent = { time: string | null; status: string | null; note: string | null };
export type TrackingInfo = {
  tracking_number: string;
  courier: string | null;
  tracking_url: string | null;
  status: string | null;
  history: TrackingEvent[];
  source: "biteship" | "none";
};

export const parseLabel = (
  trackingNumber: string,
  fallbackCourier?: string | null
): { courier: string | null; waybill: string } => {
  const m = trackingNumber.trim().match(/^([a-z0-9_-]{2,20}):(.+)$/i);
  if (m) return { courier: m[1].toLowerCase(), waybill: m[2].trim() };
  return { courier: fallbackCourier?.toLowerCase() ?? null, waybill: trackingNumber.trim() };
};

export async function fetchTracking(
  container: MedusaContainer,
  trackingNumber: string,
  trackingUrl: string | null,
  fallbackCourier?: string | null
): Promise<TrackingInfo> {
  const { courier, waybill } = parseLabel(trackingNumber, fallbackCourier);
  const base: TrackingInfo = {
    tracking_number: waybill,
    courier,
    tracking_url: trackingUrl,
    status: null,
    history: [],
    source: "none",
  };
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey || !courier) return base;

  const cache = container.resolve(Modules.CACHE);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const cacheKey = `biteship:${courier}:${waybill}`;
  const cached = await cache.get<TrackingInfo>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.biteship.com/v1/trackings/${encodeURIComponent(waybill)}/couriers/${encodeURIComponent(courier)}`,
      { headers: { Authorization: apiKey }, signal: AbortSignal.timeout(8000) }
    );
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      logger.warn(`[biteship] ${courier}/${waybill}: ${body?.error ?? res.status}`);
      return base;
    }
    const info: TrackingInfo = {
      ...base,
      status: body.status ?? null,
      tracking_url: trackingUrl ?? body.link ?? null,
      history: ((body.history as any[]) ?? []).map((h) => ({
        time: h.updated_at ?? null,
        status: h.status ?? null,
        note: h.note ?? null,
      })),
      source: "biteship",
    };
    // Carriers update every few hours; 10 minutes keeps us well inside the quota.
    await cache.set(cacheKey, info, 600);
    return info;
  } catch (e) {
    logger.warn(`[biteship] ${courier}/${waybill} failed: ${(e as Error).message}`);
    return base;
  }
}
