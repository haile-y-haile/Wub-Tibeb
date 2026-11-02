import assert from "node:assert/strict";
import test from "node:test";
import { createCloudflareWorker } from "../cloudflare/worker";
import { MAX_PHOTO_BYTES, savePrivatePhoto } from "../cloudflare/photo-storage";
import type { CloudflareEnv, SqlStore } from "../cloudflare/types";

function makeStore(queryImpl: (sql: string, values: unknown[]) => Promise<any> = async () => ({
  rows: [],
  rowCount: 0,
})): SqlStore {
  const store: SqlStore = {
    query: queryImpl,
    transaction: async (work) => work(store),
  };
  return store;
}

const baseEnv: CloudflareEnv = {
  ENVIRONMENT: "staging",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  PRIVATE_IMAGES: {
    async put() {},
    async get() {
      return null;
    },
    async delete() {},
  },
};

test("health is a liveness response and never opens PostgreSQL", async () => {
  const worker = createCloudflareWorker({
    getStore() {
      throw new Error("database must not be accessed for liveness");
    },
    async authenticate() {
      return null;
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(new Request("https://staging.example/api/healthz"), baseEnv);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("cross-origin state-changing API requests are rejected before auth or database access", async () => {
  let touched = false;
  const worker = createCloudflareWorker({
    getStore() {
      touched = true;
      throw new Error("must not touch database");
    },
    async authenticate() {
      touched = true;
      return "user-1";
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(
    new Request("https://staging.example/api/storage/uploads", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
      body: "not an image",
    }),
    baseEnv,
  );
  assert.equal(response.status, 403);
  assert.equal(touched, false);
});

test("listing discovery preserves parameterized filters and response shape", async () => {
  let capturedSql = "";
  let capturedValues: unknown[] = [];
  const row = {
    id: "dress-1",
    owner_id: "user-2",
    owner_name: "Alem",
    neighborhood: "Bole",
    status: "active",
    demo: false,
    created_at: new Date("2026-01-01T00:00:00Z"),
    data: {
      title: "White kemis",
      description: "Traditional holiday dress",
      photos: ["/api/storage/objects/uploads/00000000-0000-4000-8000-000000000002"],
      condition: "Excellent",
      color: "White",
      fabric: "Cotton",
      embroidery: "Hand embroidered",
      occasion: "Timket",
      timesWorn: 2,
      measurements: { bust: 90, waist: 75, hips: 95, shoulder: 38, length: 140, sleeves: 55 },
    },
  };
  const worker = createCloudflareWorker({
    getStore: () => makeStore(async (sql, values = []) => {
      capturedSql = sql;
      capturedValues = values;
      return { rows: [row], rowCount: 1 };
    }),
    async authenticate() {
      return "viewer-1";
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(
    new Request("https://staging.example/api/listings?occasion=Timket&q=white%25"),
    baseEnv,
  );
  assert.equal(response.status, 200);
  const result = await response.json() as Array<Record<string, unknown>>;
  assert.equal(result[0].id, "dress-1");
  assert.match(capturedSql, /lower\(l\.data->>'occasion'\)=lower\(\$2\)/);
  assert.match(capturedSql, /ILIKE \$3/);
  assert.deepEqual(capturedValues, ["viewer-1", "Timket", "%white%%"]);
});

test("photo upload enforces type, 2 MB limit and orphan cleanup", async () => {
  let putCalls = 0;
  let deleteCalls = 0;
  let recordedMetadata = 0;
  const bucket = {
    async put() {
      putCalls++;
    },
    async get() {
      return null;
    },
    async delete() {
      deleteCalls++;
    },
  };
  const validWebp = new TextEncoder().encode("RIFF0000WEBPpayload");
  await assert.rejects(
    savePrivatePhoto({
      store: makeStore(),
      bucket,
      userId: "user-1",
      contentType: "image/webp",
      bytes: new Uint8Array(MAX_PHOTO_BYTES + 1),
      uuid: "00000000-0000-4000-8000-000000000001",
    }),
    /2 MB/,
  );
  assert.equal(putCalls, 0, "oversized image must not reach R2");
  await assert.rejects(
    savePrivatePhoto({
      store: makeStore(),
      bucket,
      userId: "user-1",
      contentType: "text/plain",
      bytes: validWebp,
      uuid: "00000000-0000-4000-8000-000000000001",
    }),
    /JPEG, PNG or WebP/,
  );
  assert.equal(putCalls, 0, "unsupported type must not reach R2");
  await assert.rejects(
    savePrivatePhoto({
      store: makeStore(async () => {
        recordedMetadata++;
        throw new Error("metadata insert failed");
      }),
      bucket,
      userId: "user-1",
      contentType: "image/webp",
      bytes: validWebp,
      uuid: "00000000-0000-4000-8000-000000000001",
    }),
    /metadata insert failed/,
  );
  assert.equal(recordedMetadata, 1);
  assert.equal(putCalls, 1);
  assert.equal(deleteCalls, 1, "R2 object is deleted if its metadata insert fails");
});

test("website requests fall through to configured static assets", async () => {
  const worker = createCloudflareWorker({
    getStore: () => makeStore(),
    async authenticate() {
      return null;
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(
    new Request("https://staging.example/"),
    {
      ...baseEnv,
      ASSETS: {
        async fetch(request) {
          assert.equal(new URL(request.url).pathname, "/");
          return new Response("site shell");
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "site shell");
});

test("a match is created only for reciprocal interest in the same two garments", async () => {
  const reciprocalValues: unknown[][] = [];
  const insertedMatchValues: unknown[][] = [];
  const listings: Record<string, any> = {
    "target-dress": {
      id: "target-dress",
      owner_id: "user-2",
      owner_name: "Alem",
      neighborhood: "Bole",
      status: "active",
      demo: false,
      created_at: new Date("2026-01-01T00:00:00Z"),
      data: { title: "Target kemis" },
    },
    "offered-dress": {
      id: "offered-dress",
      owner_id: "user-1",
      owner_name: "Hana",
      neighborhood: "Arada",
      status: "active",
      demo: false,
      created_at: new Date("2026-01-02T00:00:00Z"),
      data: { title: "Offered kemis" },
    },
  };
  const store = makeStore(async (sql, values = []) => {
    if (sql.includes("SELECT l.*,p.name owner_name")) {
      const row = listings[String(values[0])];
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes("FROM kemis_blocks")) return { rows: [], rowCount: 0 };
    if (sql.includes("FROM kemis_swipes WHERE")) {
      reciprocalValues.push(values);
      return { rows: [{ "?column?": 1 }], rowCount: 1 };
    }
    if (sql.includes("INSERT INTO kemis_matches")) {
      insertedMatchValues.push(values);
      return { rows: [{ id: "match-1", created: true }], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  });
  const worker = createCloudflareWorker({
    getStore: () => store,
    async authenticate() {
      return "user-1";
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(
    new Request("https://staging.example/api/swipes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetId: "target-dress", offeredId: "offered-dress", direction: "like" }),
    }),
    baseEnv,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { matched: true, matchId: "match-1" });
  assert.deepEqual(reciprocalValues, [["user-2", "target-dress", "offered-dress"]]);
  assert.equal(insertedMatchValues[0][1], "offered-dress");
  assert.equal(insertedMatchValues[0][2], "target-dress");
  assert.equal(insertedMatchValues[0][3], "user-1");
  assert.equal(insertedMatchValues[0][4], "user-2");
});

test("stale exchange proposals cannot be accepted", async () => {
  let matchWrites = 0;
  const match = {
    id: "match-1",
    dress_a: "dress-a",
    dress_b: "dress-b",
    user_a: "user-1",
    user_b: "user-2",
    status: "proposed",
    proposal: "Saturday, Bole",
    accepted_by: [],
    completed_by: [],
    created_at: new Date("2026-01-01T00:00:00Z"),
  };
  const store = makeStore(async (sql) => {
    if (sql.includes("SELECT * FROM kemis_matches WHERE id=$1")) return { rows: [match], rowCount: 1 };
    if (sql.includes("FROM kemis_blocks")) return { rows: [], rowCount: 0 };
    if (sql.includes("SELECT id,status FROM kemis_listings")) {
      return { rows: [{ id: "dress-a", status: "active" }, { id: "dress-b", status: "active" }], rowCount: 2 };
    }
    if (sql.includes("UPDATE kemis_matches")) matchWrites++;
    return { rows: [], rowCount: 1 };
  });
  const worker = createCloudflareWorker({
    getStore: () => store,
    async authenticate() {
      return "user-2";
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(
    new Request("https://staging.example/api/matches/match-1/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "accept", expectedProposal: "Friday, Bole" }),
    }),
    baseEnv,
  );
  assert.equal(response.status, 409);
  assert.match((await response.json() as { error: string }).error, /proposal changed/i);
  assert.equal(matchWrites, 0, "stale acceptance must not change the match");
});

test("a partial handoff cannot be cancelled or release reserved garments", async () => {
  let listingWrites = 0;
  let matchWrites = 0;
  const match = {
    id: "match-1",
    dress_a: "dress-a",
    dress_b: "dress-b",
    user_a: "user-1",
    user_b: "user-2",
    status: "accepted",
    proposal: "Saturday, Bole",
    accepted_by: ["user-1", "user-2"],
    completed_by: ["user-1"],
    created_at: new Date("2026-01-01T00:00:00Z"),
  };
  const store = makeStore(async (sql) => {
    if (sql.includes("SELECT * FROM kemis_matches WHERE id=$1")) return { rows: [match], rowCount: 1 };
    if (sql.includes("FROM kemis_blocks")) return { rows: [], rowCount: 0 };
    if (sql.includes("SELECT id,status FROM kemis_listings")) {
      return { rows: [{ id: "dress-a", status: "reserved" }, { id: "dress-b", status: "reserved" }], rowCount: 2 };
    }
    if (sql.includes("UPDATE kemis_listings")) listingWrites++;
    if (sql.includes("UPDATE kemis_matches")) matchWrites++;
    return { rows: [], rowCount: 1 };
  });
  const worker = createCloudflareWorker({
    getStore: () => store,
    async authenticate() {
      return "user-2";
    },
    uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const response = await worker.fetch(
    new Request("https://staging.example/api/matches/match-1/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    }),
    baseEnv,
  );
  assert.equal(response.status, 409);
  assert.match((await response.json() as { error: string }).error, /confirmed handoff/i);
  assert.equal(listingWrites, 0);
  assert.equal(matchWrites, 0);
});
