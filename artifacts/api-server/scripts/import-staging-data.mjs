import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import { getPgCliEnvironment, requireStagingUrl } from "./cloudflare-db-safety.mjs";

const archiveFile = process.env.WUB_TIBEB_IMPORT_FILE;
if (!archiveFile) throw new Error("Set WUB_TIBEB_IMPORT_FILE to a previously reviewed protected archive.");
const connectionString = requireStagingUrl();
const client = new pg.Client({ connectionString, application_name: "wub-tibeb-staging-import-preflight" });
await client.connect();
try {
  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'kemis_%'",
  );
  for (const { tablename } of tables.rows) {
    const safeTable = String(tablename).replaceAll('"', '""');
    const count = await client.query(`SELECT EXISTS(SELECT 1 FROM "${safeTable}" LIMIT 1) AS has_rows`);
    if (count.rows[0]?.has_rows) {
      throw new Error(`Refusing import: staging table ${tablename} already contains rows. Use a fresh staging database.`);
    }
  }
} finally {
  await client.end();
}
const result = spawnSync("pg_restore", [
  "--data-only",
  "--no-owner",
  "--no-privileges",
  "--exit-on-error",
  "--single-transaction",
  resolve(archiveFile),
], { stdio: "inherit", env: getPgCliEnvironment(connectionString) });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
process.stdout.write("Staging-only import completed without dropping or truncating tables.\n");
