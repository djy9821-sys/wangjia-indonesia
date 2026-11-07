import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107061452 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_plan" drop constraint if exists "payment_plan_order_id_unique";`);
    this.addSql(`create table if not exists "payment_plan" ("id" text not null, "order_id" text not null, "currency_code" text not null, "total_amount" numeric not null, "release_policy" text check ("release_policy" in ('deposit_paid', 'full_paid')) not null default 'deposit_paid', "status" text check ("status" in ('active', 'completed', 'cancelled')) not null default 'active', "released_at" timestamptz null, "released_by" text null, "note" text null, "created_by" text null, "raw_total_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_plan_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_plan_deleted_at" ON "payment_plan" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_plan_order_id_unique" ON "payment_plan" ("order_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payment_installment" ("id" text not null, "sequence" integer not null, "label" text not null, "amount" numeric not null, "due_date" timestamptz null, "status" text check ("status" in ('unpaid', 'awaiting_confirmation', 'paid', 'cancelled')) not null default 'unpaid', "payment_method" text check ("payment_method" in ('midtrans', 'bank_transfer', 'other')) null, "gateway_reference" text null, "gateway_payload" jsonb null, "paid_at" timestamptz null, "confirmed_by" text null, "confirmed_at" timestamptz null, "note" text null, "plan_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_installment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_installment_plan_id" ON "payment_installment" ("plan_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_installment_deleted_at" ON "payment_installment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payment_proof" ("id" text not null, "file_url" text not null, "file_id" text null, "bank_name" text null, "sender_name" text null, "amount" numeric null, "transferred_at" timestamptz null, "note" text null, "status" text check ("status" in ('pending', 'accepted', 'rejected')) not null default 'pending', "submitted_by" text null, "reviewed_by" text null, "reviewed_at" timestamptz null, "review_note" text null, "installment_id" text not null, "raw_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_proof_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_proof_installment_id" ON "payment_proof" ("installment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_proof_deleted_at" ON "payment_proof" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "payment_installment" add constraint "payment_installment_plan_id_foreign" foreign key ("plan_id") references "payment_plan" ("id") on update cascade;`);

    this.addSql(`alter table if exists "payment_proof" add constraint "payment_proof_installment_id_foreign" foreign key ("installment_id") references "payment_installment" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payment_installment" drop constraint if exists "payment_installment_plan_id_foreign";`);

    this.addSql(`alter table if exists "payment_proof" drop constraint if exists "payment_proof_installment_id_foreign";`);

    this.addSql(`drop table if exists "payment_plan" cascade;`);

    this.addSql(`drop table if exists "payment_installment" cascade;`);

    this.addSql(`drop table if exists "payment_proof" cascade;`);
  }

}
