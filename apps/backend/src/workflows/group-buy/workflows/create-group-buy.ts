import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createGroupBuyStep, CreateGroupBuyInput } from "../steps/create-group-buy";

export const createGroupBuyWorkflow = createWorkflow("create-group-buy", (input: CreateGroupBuyInput) => {
  const groupBuy = createGroupBuyStep(input);
  return new WorkflowResponse(groupBuy);
});
