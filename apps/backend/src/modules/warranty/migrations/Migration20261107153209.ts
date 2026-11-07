import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107153209 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "warranty_unit" drop constraint if exists "warranty_unit_code_unique";`);
    this.addSql(`alter table if exists "warranty_unit" drop constraint if exists "warranty_unit_serial_unique";`);
    this.addSql(`create table if not exists "warranty_unit" ("id" text not null, "serial" text not null, "code" text not null, "product_id" text not null, "variant_id" text null, "product_title" text not null, "variant_title" text null, "batch" text null, "status" text check ("status" in ('in_stock', 'sold', 'registered', 'void')) not null default 'in_stock', "warranty_months" integer not null default 12, "order_id" text null, "customer_id" text null, "registered_at" timestamptz null, "registered_name" text null, "registered_phone" text null, "farm_location" text null, "warranty_expires_at" timestamptz null, "scan_count" integer not null default 0, "last_scanned_at" timestamptz null, "notes" text null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "warranty_unit_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_unit_deleted_at" ON "warranty_unit" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_warranty_unit_serial_unique" ON "warranty_unit" ("serial") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_warranty_unit_code_unique" ON "warranty_unit" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_unit_customer_id" ON "warranty_unit" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_unit_order_id" ON "warranty_unit" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_unit_status" ON "warranty_unit" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_unit_batch" ON "warranty_unit" ("batch") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "warranty_unit" cascade;`);
  }

}
