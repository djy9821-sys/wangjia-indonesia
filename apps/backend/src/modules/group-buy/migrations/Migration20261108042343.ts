import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261108042343 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "group_buy_order" drop constraint if exists "group_buy_order_group_buy_id_order_id_unique";`);
    this.addSql(`create table if not exists "group_buy" ("id" text not null, "title" text not null, "product_id" text not null, "product_handle" text null, "product_title" text not null, "variant_id" text not null, "variant_title" text null, "thumbnail" text null, "currency_code" text not null default 'idr', "group_price" integer not null, "regular_price" integer null, "min_quantity" integer not null, "max_quantity" integer null, "ends_at" timestamptz not null, "status" text check ("status" in ('open', 'success', 'failed', 'cancelled')) not null default 'open', "note" text null, "created_by" text null, "closed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "group_buy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_deleted_at" ON "group_buy" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_status" ON "group_buy" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_variant_id" ON "group_buy" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_ends_at" ON "group_buy" ("ends_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "group_buy_order" ("id" text not null, "group_buy_id" text not null, "order_id" text not null, "customer_id" text null, "quantity" integer not null, "status" text check ("status" in ('joined', 'cancelled')) not null default 'joined', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "group_buy_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_order_deleted_at" ON "group_buy_order" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_order_group_buy_id" ON "group_buy_order" ("group_buy_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_group_buy_order_customer_id" ON "group_buy_order" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_group_buy_order_group_buy_id_order_id_unique" ON "group_buy_order" ("group_buy_id", "order_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "group_buy" cascade;`);

    this.addSql(`drop table if exists "group_buy_order" cascade;`);
  }

}
