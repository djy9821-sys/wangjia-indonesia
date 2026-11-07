import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107090305 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "push_device_token" drop constraint if exists "push_device_token_token_unique";`);
    this.addSql(`create table if not exists "push_device_token" ("id" text not null, "customer_id" text not null, "token" text not null, "platform" text check ("platform" in ('ios', 'android', 'web')) not null default 'android', "app_version" text null, "locale" text null, "last_seen_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "push_device_token_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_push_device_token_deleted_at" ON "push_device_token" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_push_device_token_token_unique" ON "push_device_token" ("token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_push_device_token_customer_id" ON "push_device_token" ("customer_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "push_device_token" cascade;`);
  }

}
