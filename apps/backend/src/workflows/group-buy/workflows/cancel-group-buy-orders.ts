import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { cancelGroupBuyOrdersStep } from "../steps/record-group-buy-order";

export const cancelGroupBuyOrdersWorkflow = createWorkflow("cancel-group-buy-orders", (input: { order_id: string }) => {
  const groupBuyIds = cancelGroupBuyOrdersStep(input);
  return new WorkflowResponse(groupBuyIds);
});
