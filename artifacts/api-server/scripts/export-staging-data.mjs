import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { getPgCliEnvironment, requireStagingUrl } from "./cloudflare-db-safety.mjs";

const output = process.env.WUB_TIBEB_EXPORT_FILE;
if (!output) throw new Error("Set WUB_TIBEB_EXPORT_FILE to a protected local archive path.");
const archive = resolve(output);
const connectionString = requireStagingUrl();
const result = spawnSync("pg_dump", [
  "--format=custom",
  "--data-only",
  "--no-owner",
  "--no-privileges",
  "--file",
  archive,
], { stdio: "inherit", env: getPgCliEnvironment(connectionString) });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
process.stdout.write(`Staging-only data export created at ${archive}\n`);
