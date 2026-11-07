import { ExecArgs } from "@medusajs/framework/types";
import ownerDailyDigest from "../jobs/owner-daily-digest";

/* Dev helper: OWNER_WHATSAPP=62812… npx medusa exec ./src/scripts/run-owner-digest.ts */
export default async function ({ container }: ExecArgs) {
  await ownerDailyDigest(container);
}
