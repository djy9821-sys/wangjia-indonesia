import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { GroupBuyEvents } from "../events";
import { evaluateGroupBuyStep } from "../steps/evaluate-group-buy";
import { recordGroupBuyOrderStep, RecordGroupBuyOrderInput } from "../steps/record-group-buy-order";

/* Order placed with a group-buy line: record it and close the group if the target is met. */
export const recordGroupBuyOrderWorkflow = createWorkflow("record-group-buy-order", (input: RecordGroupBuyOrderInput) => {
  recordGroupBuyOrderStep(input);
  const result = evaluateGroupBuyStep({ group_buy_id: input.group_buy_id });
  when({ result }, ({ result }) => result.changed && result.status === "success").then(() => {
    emitEventStep(transform({ result }, ({ result }) => ({ eventName: GroupBuyEvents.SUCCESS, data: { id: result.id } })));
  });
  return new WorkflowResponse(result);
});
