import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { registerWarrantyUnitStep } from "../steps/register-warranty-unit";

export type RegisterWarrantyUnitWorkflowInput = {
  code: string;
  customer_id: string;
  farm_location?: string | null;
};

export const WarrantyEvents = { REGISTERED: "warranty.registered" } as const;

export const registerWarrantyUnitWorkflow = createWorkflow(
  "register-warranty-unit",
  (input: RegisterWarrantyUnitWorkflowInput) => {
    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "first_name", "last_name", "phone", "email"],
      filters: { id: input.customer_id },
      options: { throwIfKeyNotFound: true },
    });

    const stepInput = transform({ input, customers }, ({ input, customers }) => {
      const c = customers[0];
      return {
        code: input.code,
        customer_id: input.customer_id,
        registered_name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null,
        registered_phone: c.phone ?? null,
        farm_location: input.farm_location ?? null,
      };
    });

    const result = registerWarrantyUnitStep(stepInput);

    when({ result }, ({ result }) => result.first_time).then(() => {
      const event = transform({ result }, ({ result }) => ({
        eventName: WarrantyEvents.REGISTERED,
        data: { id: result.unit.id },
      }));
      emitEventStep(event);
    });

    return new WorkflowResponse(result);
  }
);
