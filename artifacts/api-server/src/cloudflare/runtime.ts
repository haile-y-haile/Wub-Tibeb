import { createClerkClient } from "@clerk/backend";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db/schema";
import type { CloudflareEnv, SqlExecutor, SqlStore } from "./types";

const { Pool } = pg;
const pools = new Map<string, InstanceType<typeof Pool>>();
const stores = new Map<string, SqlStore>();
const clerkClients = new Map<string, ReturnType<typeof createClerkClient>>();

function getPool(connectionString: string) {
  let pool = pools.get(connectionString);
  if (!pool) {
    pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
    pools.set(connectionString, pool);
  }
  return pool;
}

function executor(client: { query: (sql: string, values?: unknown[]) => Promise<any> }): SqlExecutor {
  return {
    async query<Row>(statement: string, values: unknown[] = []) {
      const result = await client.query(statement, values);
      return { rows: result.rows as Row[], rowCount: result.rowCount };
    },
  };
}

export function getWorkerStore(env: CloudflareEnv): SqlStore {
  const connectionString = env.HYPERDRIVE?.connectionString;
  if (!connectionString) {
    throw new Error("Cloudflare Hyperdrive is not configured for this environment");
  }
  let store = stores.get(connectionString);
  if (store) return store;

  const pool = getPool(connectionString);
  // Keep the shared Drizzle schema attached to the same Hyperdrive-backed pool.
  // Existing routes use parameterized SQL; future route ports can use this
  // schema-backed Drizzle client without defining a second data model.
  drizzle(pool, { schema });
  store = {
    ...executor(pool),
    async transaction<T>(work: (client: SqlExecutor) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await work(executor(client));
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
  stores.set(connectionString, store);
  return store;
}

export async function authenticateClerkRequest(
  request: Request,
  env: CloudflareEnv,
): Promise<string | null> {
  const secretKey = env.CLERK_SECRET_KEY;
  const publishableKey = env.CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    throw new Error("Clerk staging keys are not configured");
  }

  const cacheKey = `${publishableKey}:${secretKey}`;
  let client = clerkClients.get(cacheKey);
  if (!client) {
    client = createClerkClient({ secretKey, publishableKey });
    clerkClients.set(cacheKey, client);
  }
  const authorizedParties = (env.CLERK_AUTHORIZED_PARTIES ?? "")
    .split(",")
    .map((party) => party.trim())
    .filter(Boolean);
  const state = await client.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties: authorizedParties.length
      ? authorizedParties
      : [new URL(request.url).origin],
  });
  if (!state.isAuthenticated) return null;
  const auth = state.toAuth();
  const claimUserId = (auth.sessionClaims as Record<string, unknown>).userId;
  const userId = claimUserId ?? auth.userId;
  return typeof userId === "string" ? userId : null;
}

export function createRuntimeDependencies() {
  return {
    getStore: getWorkerStore,
    authenticate: authenticateClerkRequest,
    uuid: () => crypto.randomUUID(),
  };
}
