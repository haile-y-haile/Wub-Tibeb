export interface QueryResult<Row = Record<string, unknown>> {
  rows: Row[];
  rowCount: number | null;
}

export interface SqlExecutor {
  query<Row = Record<string, unknown>>(
    statement: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
}

export interface SqlStore extends SqlExecutor {
  transaction<T>(work: (client: SqlExecutor) => Promise<T>): Promise<T>;
}

export interface PrivateObject {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: { contentType?: string };
}

export interface PrivateBucket {
  put(
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<PrivateObject | null>;
  delete(key: string): Promise<void>;
}

export interface StaticAssets {
  fetch(request: Request): Promise<Response>;
}

export interface CloudflareEnv {
  HYPERDRIVE?: { connectionString: string };
  PRIVATE_IMAGES?: PrivateBucket;
  ASSETS?: StaticAssets;
  CLERK_SECRET_KEY?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_AUTHORIZED_PARTIES?: string;
  ENVIRONMENT?: string;
}

export interface WorkerDependencies {
  getStore(env: CloudflareEnv): SqlStore;
  authenticate(request: Request, env: CloudflareEnv): Promise<string | null>;
  uuid(): string;
}
