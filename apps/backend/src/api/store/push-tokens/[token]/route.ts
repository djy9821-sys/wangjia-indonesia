import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { PUSH_DEVICE_MODULE } from "../../../../modules/push-device";
import PushDeviceModuleService from "../../../../modules/push-device/service";

/* DELETE /store/push-tokens/:token — called on logout. */
export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<PushDeviceModuleService>(PUSH_DEVICE_MODULE);
  const [existing] = await service.listPushDeviceTokens({
    token: req.params.token,
    customer_id: req.auth_context.actor_id,
  });
  if (existing) {
    await service.deletePushDeviceTokens(existing.id);
  }
  res.json({ deleted: Boolean(existing) });
};
