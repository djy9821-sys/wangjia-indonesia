import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import PaymentPlanModule from "../modules/payment-plan";

export default defineLink(
  OrderModule.linkable.order,
  PaymentPlanModule.linkable.paymentPlan
);
