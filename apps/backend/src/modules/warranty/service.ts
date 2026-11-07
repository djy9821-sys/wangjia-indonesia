import { MedusaService } from "@medusajs/framework/utils";
import { WarrantyUnit } from "./models";

/* Serial numbers, QR codes and warranty registrations. See models/warranty-unit. */
class WarrantyModuleService extends MedusaService({ WarrantyUnit }) {}

export default WarrantyModuleService;
