import { Module } from "@medusajs/framework/utils";
import PaymentPlanModuleService from "./service";

export const PAYMENT_PLAN_MODULE = "payment_plan";

export default Module(PAYMENT_PLAN_MODULE, {
  service: PaymentPlanModuleService,
});
