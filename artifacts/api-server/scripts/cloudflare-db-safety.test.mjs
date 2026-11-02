import assert from "node:assert/strict";
import test from "node:test";
import {
  getPgCliEnvironment,
  requireStagingUrl,
  stripMigrationTransaction,
} from "./cloudflare-db-safety.mjs";

test("staging DB tooling requires an explicit staging marker and never falls back to DATABASE_URL", () => {
  const productionUrl = "postgres://prod:secret@db.example/wubtibeb";
  assert.throws(() => requireStagingUrl({ DATABASE_URL: productionUrl }), /WUB_TIBEB_CONFIRM_STAGING/);
  assert.throws(() => requireStagingUrl({
    WUB_TIBEB_CONFIRM_STAGING: "yes",
    DATABASE_URL: productionUrl,
  }), /WUB_TIBEB_STAGING_DATABASE_URL/);
  assert.throws(() => requireStagingUrl({
    WUB_TIBEB_CONFIRM_STAGING: "yes",
    WUB_TIBEB_STAGING_DATABASE_URL: "postgres://stage:secret@db.example/wubtibeb",
    DATABASE_URL: productionUrl,
  }), /marked staging/);
  const stagingUrl = "postgres://stage:secret@db.example/wubtibeb_staging";
  assert.equal(requireStagingUrl({
    WUB_TIBEB_CONFIRM_STAGING: "yes",
    WUB_TIBEB_STAGING_DATABASE_URL: stagingUrl,
    DATABASE_URL: productionUrl,
  }), stagingUrl);
  assert.throws(() => requireStagingUrl({
    WUB_TIBEB_CONFIRM_STAGING: "yes",
    WUB_TIBEB_STAGING_DATABASE_URL: productionUrl,
    DATABASE_URL: productionUrl,
  }), /Refusing to use DATABASE_URL/);
});

test("pg_dump/pg_restore receive credentials through env, not command-line arguments", () => {
  const childEnv = getPgCliEnvironment(
    "postgres://stage-user:stage-pass@db.example:5433/wubtibeb_staging?sslmode=require",
    { DATABASE_URL: "not-forwarded", WUB_TIBEB_STAGING_DATABASE_URL: "not-forwarded" },
  );
  assert.equal(childEnv.PGHOST, "db.example");
  assert.equal(childEnv.PGPORT, "5433");
  assert.equal(childEnv.PGUSER, "stage-user");
  assert.equal(childEnv.PGPASSWORD, "stage-pass");
  assert.equal(childEnv.PGDATABASE, "wubtibeb_staging");
  assert.equal(childEnv.PGSSLMODE, "require");
  assert.equal(childEnv.WUB_TIBEB_STAGING_DATABASE_URL, undefined);
  assert.equal(childEnv.DATABASE_URL, undefined);
});

test("migration transaction wrappers are removed even after SQL comments", () => {
  const source = "-- source migration\nBEGIN;\nCREATE TABLE staging_example(id text);\nCOMMIT;\n";
  const migrated = stripMigrationTransaction(source);
  assert.match(migrated, /CREATE TABLE staging_example/);
  assert.doesNotMatch(migrated, /^\s*BEGIN\s*;/m);
  assert.doesNotMatch(migrated, /^\s*COMMIT\s*;/m);
});
