import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { PUSH_DEVICE_MODULE } from "../../../modules/push-device";
import PushDeviceModuleService from "../../../modules/push-device/service";

type Body = { token: string; platform?: "ios" | "android" | "web"; app_version?: string | null; locale?: string | null };

/* POST /store/push-tokens — register (or re-own) this device's FCM token. */
export const POST = async (req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) => {
  const service = req.scope.resolve<PushDeviceModuleService>(PUSH_DEVICE_MODULE);
  const customerId = req.auth_context.actor_id;
  const { token, platform = "android", app_version = null, locale = null } = req.validatedBody;

  const [existing] = await service.listPushDeviceTokens({ token });
  const data = { customer_id: customerId, platform, app_version, locale, last_seen_at: new Date() };
  const saved = existing
    ? await service.updatePushDeviceTokens({ id: existing.id, ...data })
    : await service.createPushDeviceTokens({ token, ...data });

  res.json({ device: { id: saved.id, platform: saved.platform } });
};

/* GET /store/push-tokens — the caller's registered devices. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<PushDeviceModuleService>(PUSH_DEVICE_MODULE);
  const devices = await service.listPushDeviceTokens({ customer_id: req.auth_context.actor_id });
  res.json({ devices: devices.map((d) => ({ id: d.id, platform: d.platform, last_seen_at: d.last_seen_at })) });
};
