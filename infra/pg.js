// Local development PostgreSQL, no Homebrew/Docker needed.
// Usage:  node pg.js            -> start (keeps running, Ctrl+C to stop)
//         node pg.js init-only  -> initialise cluster + create database, then exit
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(here, "pgdata");
const PORT = Number(process.env.PGPORT || 5432);
const DB_NAME = process.env.PGDATABASE || "indo_b2b";

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  onLog: () => {},
  onError: (m) => process.stderr.write(String(m)),
});

async function main() {
  const fresh = !existsSync(path.join(databaseDir, "PG_VERSION"));
  if (fresh) {
    console.log(`[pg] initialising cluster in ${databaseDir}`);
    await pg.initialise();
  }
  await pg.start();
  console.log(`[pg] listening on 127.0.0.1:${PORT}`);

  const client = pg.getPgClient();
  await client.connect();
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
  if (rows.length === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`[pg] created database ${DB_NAME}`);
  }
  await client.end();
  console.log(`[pg] DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${PORT}/${DB_NAME}`);

  if (process.argv[2] === "init-only") {
    await pg.stop();
    return;
  }
  const stop = async () => { console.log("\n[pg] stopping"); await pg.stop(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => { console.error(e); process.exit(1); });
