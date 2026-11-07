import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import WhatsAppNotificationService from "./service";

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [WhatsAppNotificationService],
});
