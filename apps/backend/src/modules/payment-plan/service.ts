import { MedusaService } from "@medusajs/framework/utils";
import { Installment, PaymentPlan, PaymentProof } from "./models";

/*
  Payment plan module.

  A payment plan belongs to one order and splits the order total into
  installments (e.g. 30% deposit, 70% balance before shipping). Each
  installment is paid either through the Midtrans gateway or by manual bank
  transfer. Bank transfers are backed by uploaded proofs that finance staff
  must accept before the installment counts as paid.

  Warehouse fulfillment is unlocked ("released") when the plan's release
  policy is satisfied: deposit paid, or everything paid.
*/
/*
  The key names decide the generated method names AND the entity names the
  Query graph resolves ("payment_installment" -> listPaymentInstallments),
  so they must match the DML model names.
*/
class PaymentPlanModuleService extends MedusaService({
  PaymentPlan,
  PaymentInstallment: Installment,
  PaymentProof,
}) {}

export default PaymentPlanModuleService;
