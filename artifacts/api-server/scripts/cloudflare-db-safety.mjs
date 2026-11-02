import { URL } from "node:url";

export function requireStagingUrl(env = process.env) {
  if (env.WUB_TIBEB_CONFIRM_STAGING !== "yes") {
    throw new Error("Set WUB_TIBEB_CONFIRM_STAGING=yes after confirming this is an isolated staging database.");
  }
  const connectionString = env.WUB_TIBEB_STAGING_DATABASE_URL;
  if (!connectionString) {
    throw new Error("WUB_TIBEB_STAGING_DATABASE_URL is required; DATABASE_URL is never used by these scripts.");
  }
  if (connectionString === env.DATABASE_URL) {
    throw new Error("Refusing to use DATABASE_URL. Configure a separate staging database URL.");
  }
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Staging database URL must use PostgreSQL.");
  }
  if (/replit/i.test(url.hostname)) {
    throw new Error("Refusing a Replit-hosted database URL; use a separate staging PostgreSQL service.");
  }
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/(^|[-_])staging($|[-_])/i.test(databaseName)) {
    throw new Error("Refusing a database whose name is not explicitly marked staging.");
  }
  return connectionString;
}

export function getPgCliEnvironment(connectionString, sourceEnvironment = process.env) {
  const url = new URL(connectionString);
  const env = { ...sourceEnvironment };
  delete env.DATABASE_URL;
  delete env.WUB_TIBEB_STAGING_DATABASE_URL;
  env.PGHOST = url.hostname;
  env.PGPORT = url.port || "5432";
  env.PGUSER = decodeURIComponent(url.username);
  env.PGPASSWORD = decodeURIComponent(url.password);
  env.PGDATABASE = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode) env.PGSSLMODE = sslmode;
  return env;
}

export function stripMigrationTransaction(sql) {
  return sql
    .replace(/^\s*BEGIN\s*;\s*$/im, "")
    .replace(/^\s*COMMIT\s*;\s*$/im, "");
}
