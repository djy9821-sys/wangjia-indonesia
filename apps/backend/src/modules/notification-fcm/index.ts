import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import FcmNotificationService from "./service";

export default ModuleProvider(Modules.NOTIFICATION, { services: [FcmNotificationService] });
