import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { anonymizeCustomerStep } from "../steps/anonymize-customer";

export const deleteCustomerAccountWorkflow = createWorkflow(
  "delete-customer-account",
  (input: { customer_id: string; auth_identity_id?: string | null }) => {
    const result = anonymizeCustomerStep(input);
    return new WorkflowResponse(result);
  }
);
