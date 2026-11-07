import { ExecArgs } from "@medusajs/framework/types";
import postDeliveryFollowup from "../jobs/post-delivery-followup";

/* Dev helper: FOLLOWUP_DAYS=0 npx medusa exec ./src/scripts/run-followup.ts */
export default async function ({ container }: ExecArgs) {
  await postDeliveryFollowup(container);
}
