import { MedusaService } from "@medusajs/framework/utils";
import { DeviceToken } from "./models/device-token";

class PushDeviceModuleService extends MedusaService({ PushDeviceToken: DeviceToken }) {}

export default PushDeviceModuleService;
