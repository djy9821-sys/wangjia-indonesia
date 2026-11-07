import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/*
  An order may carry several plans over time (cancelled ones stay for the
  audit trail) but only one that is not cancelled.
*/
export class Migration20261107081500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop index if exists "IDX_payment_plan_order_id_unique";`);
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_plan_order_id_unique" ON "payment_plan" ("order_id") WHERE deleted_at IS NULL AND status <> 'cancelled';`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_payment_plan_order_id_unique";`);
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_plan_order_id_unique" ON "payment_plan" ("order_id") WHERE deleted_at IS NULL;`
    );
  }
}
