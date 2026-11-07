import { ExecArgs } from "@medusajs/framework/types";
import paymentReminders from "../jobs/payment-reminders";

/* Run the daily reminder job once, by hand:  pnpm medusa exec ./src/scripts/run-reminders.ts */
export default async function runReminders({ container }: ExecArgs) {
  await paymentReminders(container);
}
