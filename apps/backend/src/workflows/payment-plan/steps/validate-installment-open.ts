import { createStep } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { InstallmentStatus } from "../../../types";

type Input = {
  installment: { id: string; status: string };
  allowed: InstallmentStatus[];
  action: string;
  // What a customer reads instead of the staff text, where a customer can get here.
  message?: string;
};

export const validateInstallmentOpenStep = createStep(
  "validate-installment-open",
  async ({ installment, allowed, action, message }: Input) => {
    if (!allowed.includes(installment.status as InstallmentStatus)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        message ?? `无法${action}：该期款项当前状态为 ${installment.status}`
      );
    }
  }
);
