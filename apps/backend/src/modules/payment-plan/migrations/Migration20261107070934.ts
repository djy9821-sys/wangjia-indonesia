import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107070934 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_refund" ("id" text not null, "amount" numeric not null, "method" text check ("method" in ('midtrans', 'bank_transfer', 'other')) not null, "status" text check ("status" in ('pending', 'completed', 'failed')) not null default 'completed', "reason" text null, "gateway_reference" text null, "gateway_payload" jsonb null, "bank_account" text null, "note" text null, "created_by" text null, "completed_at" timestamptz null, "installment_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_refund_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_refund_installment_id" ON "payment_refund" ("installment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_refund_deleted_at" ON "payment_refund" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "payment_refund" add constraint "payment_refund_installment_id_foreign" foreign key ("installment_id") references "payment_installment" ("id") on update cascade;`);

    this.addSql(`alter table if exists "payment_installment" drop constraint if exists "payment_installment_status_check";`);

    this.addSql(`alter table if exists "payment_installment" add column if not exists "refunded_amount" numeric not null default 0, add column if not exists "raw_refunded_amount" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "payment_installment" add constraint "payment_installment_status_check" check("status" in ('unpaid', 'awaiting_confirmation', 'paid', 'refunded', 'cancelled'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_refund" cascade;`);

    this.addSql(`alter table if exists "payment_installment" drop constraint if exists "payment_installment_status_check";`);

    this.addSql(`alter table if exists "payment_installment" drop column if exists "refunded_amount", drop column if exists "raw_refunded_amount";`);

    this.addSql(`alter table if exists "payment_installment" add constraint "payment_installment_status_check" check("status" in ('unpaid', 'awaiting_confirmation', 'paid', 'cancelled'));`);
  }

}
