import { ExecArgs } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import warrantyExpiryReminders from "../jobs/warranty-expiry-reminders";
import { WARRANTY_MODULE } from "../modules/warranty";
import WarrantyModuleService from "../modules/warranty/service";

/*
  Dev helper: run the warranty expiry reminder job now.
    npx medusa exec ./src/scripts/run-warranty-reminders.ts [serial-to-expire-soon]
  With a serial, that unit's expiry is first moved to 10 days from now.
*/
export default async function ({ container, args }: ExecArgs) {
  const serial = args?.[0];
  if (serial) {
    const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    const [unit] = await service.listWarrantyUnits({ serial });
    if (!unit) throw new MedusaError(MedusaError.Types.NOT_FOUND, "serial not found");
    await service.updateWarrantyUnits({ id: unit.id, warranty_expires_at: new Date(Date.now() + 10 * 86400000) });
  }
  await warrantyExpiryReminders(container);
}
