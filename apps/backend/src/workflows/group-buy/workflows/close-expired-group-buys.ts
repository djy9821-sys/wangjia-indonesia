import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { GroupBuyEvents } from "../events";
import { emitGroupBuyEventsStep } from "../steps/emit-group-buy-events";
import { expireGroupBuysStep } from "../steps/evaluate-group-buy";

/* Scheduled: settle every open group buy whose deadline has passed. */
export const closeExpiredGroupBuysWorkflow = createWorkflow("close-expired-group-buys", (input: { now?: Date }) => {
  const result = expireGroupBuysStep(input);
  emitGroupBuyEventsStep(
    transform({ result }, ({ result }) => ({
      events: [
        { name: GroupBuyEvents.FAILED, ids: result.failed },
        { name: GroupBuyEvents.SUCCESS, ids: result.succeeded },
      ],
    }))
  );
  return new WorkflowResponse(result);
});
