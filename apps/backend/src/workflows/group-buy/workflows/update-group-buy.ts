import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { updateGroupBuyStep, UpdateGroupBuyInput } from "../steps/update-group-buy";

export const updateGroupBuyWorkflow = createWorkflow("update-group-buy", (input: UpdateGroupBuyInput) => {
  const groupBuy = updateGroupBuyStep(input);
  return new WorkflowResponse(groupBuy);
});
