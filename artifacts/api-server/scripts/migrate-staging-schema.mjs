import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { requireStagingUrl, stripMigrationTransaction } from "./cloudflare-db-safety.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "../../../lib/db/migrations");
const client = new pg.Client({ connectionString: requireStagingUrl(), application_name: "wub-tibeb-staging-migrations" });
await client.connect();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS wubtibeb_schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const files = (await readdir(migrationsDir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  for (const filename of files) {
    const found = await client.query("SELECT 1 FROM wubtibeb_schema_migrations WHERE filename=$1", [filename]);
    if (found.rowCount) continue;
    const source = await readFile(resolve(migrationsDir, filename), "utf8");
    const sql = stripMigrationTransaction(source);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO wubtibeb_schema_migrations(filename) VALUES($1)", [filename]);
      await client.query("COMMIT");
      process.stdout.write(`Applied ${filename}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  process.stdout.write("Staging schema is current. No production database was used.\n");
} finally {
  await client.end();
}
