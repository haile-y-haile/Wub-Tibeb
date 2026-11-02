import {
  CreateListingBody,
  GetMessagesResponse,
  GetListingResponse,
  GetMatchesResponse,
  GetListingsResponse,
  GetProfileResponse,
  SaveProfileBody,
  SendMessageBody,
  SendMessageResponse,
  SwipeDressBody,
  SwipeDressResponse,
  UpdateExchangeBody,
  UpdateExchangeResponse,
  UploadPhotoResponse,
} from "@workspace/api-zod";
import { ZodError } from "zod";
import type { WorkerDependencies, CloudflareEnv, SqlExecutor } from "./types";
import { createRuntimeDependencies } from "./runtime";
import {
  MAX_PHOTO_BYTES,
  readLimitedBody,
  savePrivatePhoto,
  UploadError,
} from "./photo-storage";

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function failure(error: unknown): Response {
  if (error instanceof HttpError || error instanceof UploadError) {
    return json({ error: error.message }, error.status);
  }
  if (error instanceof ZodError) {
    return json({ error: "Invalid input", details: error.issues }, 400);
  }
  if (error instanceof SyntaxError) return json({ error: "Invalid JSON body" }, 400);
  const message = error instanceof Error ? error.message : "";
  if (/hyperdrive is not configured|clerk staging keys are not configured/i.test(message)) {
    return json({ error: "Staging service is not configured" }, 503);
  }
  const code = (error as { code?: string } | null)?.code;
  if (
    ["08000", "08003", "08006", "28000", "53300", "57P01", "57P02", "57P03"].includes(code ?? "") ||
    /ECONN|timeout|endpoint has been disabled|database.*unavailable/i.test(message)
  ) {
    return json({ error: "Database is temporarily unavailable. Please try again." }, 503);
  }
  return json({ error: "Something went wrong. Please try again." }, 500);
}

function firstParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key);
  return value && value.length <= 100 ? value : undefined;
}

function listingFromRow(row: any) {
  return {
    ...(row.data ?? {}),
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? "Member",
    neighborhood: row.neighborhood ?? "Addis Ababa",
    status: row.status,
    demo: row.demo,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function loadListing(store: SqlExecutor, id: string) {
  const result = await store.query(
    "SELECT l.*,p.name owner_name,p.neighborhood FROM kemis_listings l JOIN kemis_profiles p ON p.id=l.owner_id WHERE l.id=$1",
    [id],
  );
  if (!result.rows[0]) throw new HttpError(404, "Dress not found");
  return listingFromRow(result.rows[0]);
}

async function currentUser(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
  required = false,
): Promise<string | null> {
  if (!env.CLERK_SECRET_KEY || !env.CLERK_PUBLISHABLE_KEY) {
    if (required) throw new HttpError(503, "Clerk staging keys are not configured");
    return null;
  }
  const userId = await deps.authenticate(request, env);
  if (!userId && required) throw new HttpError(401, "Sign in to continue");
  return userId;
}

async function clerkProxy(request: Request, env: CloudflareEnv): Promise<Response> {
  if (!env.CLERK_SECRET_KEY) {
    return json({ error: "Clerk staging proxy is not configured" }, 503);
  }
  const incoming = new URL(request.url);
  const suffix = incoming.pathname.replace(/^\/api\/__clerk/, "") || "/";
  const upstream = new URL(`https://frontend-api.clerk.dev${suffix}`);
  upstream.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("Clerk-Proxy-Url", `${incoming.origin}/api/__clerk`);
  headers.set("Clerk-Secret-Key", env.CLERK_SECRET_KEY);
  const forwardedIp = request.headers.get("cf-connecting-ip");
  if (forwardedIp) headers.set("X-Forwarded-For", forwardedIp);
  const response = await fetch(upstream, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });
  const responseHeaders = new Headers(response.headers);
  for (const name of ["connection", "keep-alive", "transfer-encoding", "upgrade"]) {
    responseHeaders.delete(name);
  }
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

async function getListings(request: Request, env: CloudflareEnv, deps: WorkerDependencies) {
  const url = new URL(request.url);
  const userId = await currentUser(request, env, deps);
  const mine = url.searchParams.get("mine") === "true";
  if (mine && !userId) throw new HttpError(401, "Sign in to see your wardrobe");
  const store = deps.getStore(env);
  const values: unknown[] = [userId ?? ""];
  let where = mine
    ? "l.owner_id=$1 AND l.status <> 'archived'"
    : "l.status='active' AND l.owner_id<>$1 AND NOT EXISTS(SELECT 1 FROM kemis_passes pp WHERE pp.user_id=$1 AND pp.target_id=l.id)";
  where += " AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=$1 AND b.blocked=l.owner_id) OR (b.blocked=$1 AND b.blocker=l.owner_id))";
  for (const key of ["occasion", "color", "condition", "fabric"]) {
    const value = firstParam(url, key);
    if (value) {
      values.push(value);
      where += ` AND lower(l.data->>'${key}')=lower($${values.length})`;
    }
  }
  const neighborhood = firstParam(url, "neighborhood");
  if (neighborhood) {
    values.push(neighborhood);
    where += ` AND lower(p.neighborhood)=lower($${values.length})`;
  }
  const query = firstParam(url, "q");
  if (query) {
    values.push(`%${query}%`);
    where += ` AND (l.data->>'title' ILIKE $${values.length} OR l.data->>'description' ILIKE $${values.length})`;
  }
  const before = url.searchParams.get("before");
  if (before !== null) {
    if (!before || before.length > 160) throw new HttpError(400, "Invalid input");
    values.push(before);
    where += ` AND (l.created_at,l.id)<(SELECT created_at,id FROM kemis_listings WHERE id=$${values.length})`;
  }
  const profile = userId
    ? (await store.query("SELECT measurements FROM kemis_profiles WHERE id=$1", [userId])).rows[0]
    : null;
  const preferredMeasurements =
    profile?.measurements && typeof profile.measurements === "object"
      ? profile.measurements as Record<string, number>
      : null;
  if (url.searchParams.get("compatible") === "true") {
    if (!preferredMeasurements) {
      throw new HttpError(400, "Save your preferred garment measurements in your profile first");
    }
    for (const key of ["bust", "waist", "hips", "shoulder", "length", "sleeves"]) {
      values.push(preferredMeasurements[key]);
      where += ` AND abs((l.data->'measurements'->>'${key}')::numeric-$${values.length}::numeric)<=${key === "length" ? 10 : 5}`;
    }
  }
  const result = await store.query(
    `SELECT l.*,p.name owner_name,p.neighborhood FROM kemis_listings l JOIN kemis_profiles p ON p.id=l.owner_id WHERE ${where} ORDER BY l.created_at DESC,l.id DESC LIMIT 100`,
    values,
  );
  let listings = result.rows.map(listingFromRow);
  if (preferredMeasurements) {
    listings = listings.map((item: any) => ({
      ...item,
      compatible: Object.keys(preferredMeasurements).every(
        (key) => Math.abs(item.measurements?.[key] - preferredMeasurements[key]) <= (key === "length" ? 10 : 5),
      ),
    }));
  }
  if (url.searchParams.get("compatible") === "true") {
    listings = listings.filter((item: any) => item.compatible);
  }
  return json(GetListingsResponse.parse(listings));
}

async function ensureProfile(store: SqlExecutor, userId: string) {
  await store.query("INSERT INTO kemis_profiles(id) VALUES($1) ON CONFLICT DO NOTHING", [userId]);
}

async function handleProfile(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const store = deps.getStore(env);
  await ensureProfile(store, userId!);
  if (request.method === "GET") {
    const result = await store.query("SELECT * FROM kemis_profiles WHERE id=$1", [userId]);
    const profile = result.rows[0];
    if (profile.name === "Member") {
      return json({ error: "Complete your profile to get started" }, 404);
    }
    return json(GetProfileResponse.parse({
      id: profile.id,
      name: profile.name,
      neighborhood: profile.neighborhood,
      language: profile.language,
      role: profile.role,
      ...(profile.measurements ? { measurements: profile.measurements } : {}),
    }));
  }
  if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);
  const body = SaveProfileBody.parse(await request.json());
  if (!body.name.trim() || !body.neighborhood.trim()) {
    throw new HttpError(400, "Name and general neighborhood are required");
  }
  await store.query(
    "UPDATE kemis_profiles SET name=$2,neighborhood=$3,language=$4,measurements=$5 WHERE id=$1",
    [userId, body.name.trim(), body.neighborhood.trim(), body.language, body.measurements ? JSON.stringify(body.measurements) : null],
  );
  const updated = await store.query("SELECT role FROM kemis_profiles WHERE id=$1", [userId]);
  return json(GetProfileResponse.parse({ ...body, id: userId, role: updated.rows[0]?.role ?? "member" }));
}

async function createListing(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const body = CreateListingBody.parse(await request.json());
  const { clientRequestId, ...listingData } = body;
  const store = deps.getStore(env);
  await ensureProfile(store, userId!);
  const profile = (await store.query("SELECT name FROM kemis_profiles WHERE id=$1", [userId])).rows[0];
  if (profile.name === "Member") {
    throw new HttpError(400, "Please complete your profile before listing a Habesha kemis");
  }
  const paths = listingData.photos;
  if (new Set(paths).size !== paths.length) {
    throw new HttpError(400, "A listing cannot use the same photo more than once");
  }
  const expectedPrefix = "/api/storage/objects/uploads/";
  if (paths.some((path) => !new RegExp(`^${expectedPrefix}[a-f0-9-]{36}$`).test(path))) {
    throw new HttpError(400, "Upload dress photos using the photo picker");
  }
  const id = clientRequestId ?? deps.uuid();
  const result = await store.transaction(async (client) => {
    if (paths.length) {
      const uploads = await client.query(
        "SELECT path FROM kemis_uploads WHERE owner_id=$1 AND path=ANY($2::text[]) FOR UPDATE",
        [userId, paths],
      );
      if (uploads.rowCount !== paths.length) {
        throw new HttpError(403, "A photo is no longer available or does not belong to you");
      }
    }
    const existing = await client.query("SELECT owner_id,data FROM kemis_listings WHERE id=$1", [id]);
    if (existing.rows[0]) {
      if (existing.rows[0].owner_id !== userId || stableJson(existing.rows[0].data) !== stableJson(listingData)) {
        throw new HttpError(409, "This request was already used with different details.");
      }
      return { created: false, listing: await loadListing(client, id) };
    }
    await client.query(
      "INSERT INTO kemis_listings(id,owner_id,data) VALUES($1,$2,$3)",
      [id, userId, JSON.stringify(listingData)],
    );
    return { created: true, listing: await loadListing(client, id) };
  });
  return json(GetListingResponse.parse(result.listing), result.created ? 201 : 200);
}

async function uploadPhoto(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const store = deps.getStore(env);
  const bucket = env.PRIVATE_IMAGES;
  if (!bucket) throw new HttpError(503, "Private staging photo storage is not configured");
  const count = await store.query(
    "SELECT count(*)::int n FROM kemis_uploads WHERE owner_id=$1 AND created_at>now()-interval '1 hour'",
    [userId],
  );
  if (Number(count.rows[0]?.n ?? 0) >= 30) {
    throw new HttpError(429, "Photo upload limit reached. Please try later.");
  }
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) {
    throw new UploadError("Upload a JPEG, PNG or WebP photo", 415);
  }
  const bytes = await readLimitedBody(request);
  const path = await savePrivatePhoto({
    store,
    bucket,
    userId: userId!,
    contentType: type,
    bytes,
    uuid: deps.uuid(),
  });
  return json(UploadPhotoResponse.parse({ objectPath: path }), 201);
}

async function servePrivatePhoto(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
  id: string,
  head = false,
): Promise<Response> {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return json({ error: "Photo not found" }, 404);
  const userId = await currentUser(request, env, deps);
  const path = `/api/storage/objects/uploads/${id}`;
  const store = deps.getStore(env);
  const authorized = await store.query(
    `SELECT u.path,u.content_type,u.size FROM kemis_uploads u
     WHERE u.path=$1 AND (
       u.owner_id=$2
       OR EXISTS(SELECT 1 FROM kemis_listings l WHERE l.status='active' AND l.data->'photos' ? u.path
         AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=$2 AND b.blocked=l.owner_id) OR (b.blocked=$2 AND b.blocker=l.owner_id)))
       OR EXISTS(SELECT 1 FROM kemis_listings l JOIN kemis_matches m ON (l.id=m.dress_a OR l.id=m.dress_b)
         WHERE l.data->'photos' ? u.path AND ($2=m.user_a OR $2=m.user_b)
         AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=m.user_a AND b.blocked=m.user_b) OR (b.blocked=m.user_a AND b.blocker=m.user_b)))
     )`,
    [path, userId ?? ""],
  );
  const metadata = authorized.rows[0];
  if (!metadata || Number(metadata.size) > MAX_PHOTO_BYTES) {
    return json({ error: "Photo not found" }, 404);
  }
  const bucket = env.PRIVATE_IMAGES;
  if (!bucket) throw new HttpError(503, "Private staging photo storage is not configured");
  const object = await bucket.get(`uploads/${id}`);
  const contentType = String(metadata.content_type ?? "");
  if (!object || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    return json({ error: "Photo not found" }, 404);
  }
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
  if (head) {
    await object.body.cancel();
    return new Response(null, { headers });
  }
  return new Response(object.body, {
    headers,
  });
}

async function deleteUpload(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
  id: string,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  if (!/^[a-f0-9-]{36}$/i.test(id)) return json({ error: "Invalid photo id" }, 400);
  const store = deps.getStore(env);
  const bucket = env.PRIVATE_IMAGES;
  if (!bucket) throw new HttpError(503, "Private staging photo storage is not configured");
  const path = `/api/storage/objects/uploads/${id}`;
  await store.transaction(async (client) => {
    const upload = await client.query(
      "SELECT path FROM kemis_uploads WHERE path=$1 AND owner_id=$2 FOR UPDATE",
      [path, userId],
    );
    if (!upload.rowCount) throw new HttpError(404, "Photo not found");
    const referenced = await client.query(
      "SELECT 1 FROM kemis_listings WHERE data->'photos' ? $1 LIMIT 1",
      [path],
    );
    if (referenced.rowCount) throw new HttpError(409, "Photo is still used by a listing");
    await client.query("DELETE FROM kemis_uploads WHERE path=$1 AND owner_id=$2", [path, userId]);
  });
  try {
    await bucket.delete(`uploads/${id}`);
  } catch {
    // The database row is already gone, so the private object is unreachable.
    // A staging R2 reconciliation job can remove the orphan later.
    throw new HttpError(502, "Photo metadata was removed but object cleanup needs retry");
  }
  return new Response(null, { status: 204 });
}

async function swipeDress(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const input = SwipeDressBody.parse(await request.json());
  const store = deps.getStore(env);
  await ensureProfile(store, userId!);
  const result = await store.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72498301)");
    const target = await loadListing(client, input.targetId);
    if (target.ownerId === userId) throw new HttpError(400, "You cannot like your own dress");
    if (target.status !== "active") throw new HttpError(409, "Dress is unavailable");
    const blocked = await client.query(
      "SELECT 1 FROM kemis_blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)",
      [userId, target.ownerId],
    );
    if (blocked.rowCount) throw new HttpError(409, "Dress is unavailable");
    if (input.direction === "pass") {
      await client.query("INSERT INTO kemis_passes(user_id,target_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [
        userId,
        target.id,
      ]);
      return { matched: false };
    }
    if (!input.offeredId) throw new HttpError(400, "Choose one of your active dresses to offer");
    const offered = await loadListing(client, input.offeredId);
    if (offered.ownerId !== userId) throw new HttpError(403, "You can only offer your own dress");
    if (offered.status !== "active") throw new HttpError(409, "Your dress is unavailable");
    if (offered.demo || target.demo) throw new HttpError(400, "Demonstration dresses cannot be exchanged");
    await client.query(
      "INSERT INTO kemis_swipes(user_id,offered_id,target_id,direction) VALUES($1,$2,$3,'like') ON CONFLICT(user_id,offered_id,target_id) DO UPDATE SET direction='like'",
      [userId, offered.id, target.id],
    );
    const reciprocal = await client.query(
      "SELECT 1 FROM kemis_swipes WHERE user_id=$1 AND offered_id=$2 AND target_id=$3 AND direction='like'",
      [target.ownerId, target.id, offered.id],
    );
    if (!reciprocal.rowCount) return { matched: false };

    const [dressA, dressB] = [offered, target].sort((a: any, b: any) => a.id.localeCompare(b.id));
    const match = await client.query(
      "INSERT INTO kemis_matches(id,dress_a,dress_b,user_a,user_b) VALUES($1,$2,$3,$4,$5) ON CONFLICT(dress_a,dress_b) WHERE status <> 'cancelled' DO UPDATE SET id=kemis_matches.id RETURNING id,(xmax=0) AS created",
      [deps.uuid(), dressA.id, dressB.id, dressA.ownerId, dressB.ownerId],
    );
    if (match.rows[0]?.created === true || match.rows[0]?.created === "t") {
      await client.query("INSERT INTO kemis_notifications(id,user_id,text) VALUES($1,$2,$3)", [
        deps.uuid(),
        userId,
        "It's a match! You both chose the same two kemis.",
      ]);
      await client.query("INSERT INTO kemis_notifications(id,user_id,text) VALUES($1,$2,$3)", [
        deps.uuid(),
        target.ownerId,
        "It's a match! You both chose the same two kemis.",
      ]);
    }
    return { matched: true, matchId: match.rows[0].id };
  });
  return json(SwipeDressResponse.parse(result));
}

async function listMatches(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const url = new URL(request.url);
  const values: unknown[] = [userId];
  let where = "($1=user_a OR $1=user_b) AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=m.user_a AND b.blocked=m.user_b) OR (b.blocker=m.user_b AND b.blocked=m.user_a))";
  if (url.searchParams.has("before")) {
    const before = url.searchParams.get("before") ?? "";
    if (!before || before.length > 160) throw new HttpError(400, "Invalid input");
    values.push(before);
    where += ` AND (m.created_at,m.id)<(SELECT created_at,id FROM kemis_matches WHERE id=$${values.length})`;
  }
  if (url.searchParams.has("id")) {
    const id = url.searchParams.get("id") ?? "";
    if (id.length > 160) throw new HttpError(400, "Invalid input");
    values.push(id);
    where += ` AND m.id=$${values.length}`;
  }
  const store = deps.getStore(env);
  const result = await store.query(
    `SELECT m.* FROM kemis_matches m WHERE ${where} ORDER BY m.created_at DESC,m.id DESC LIMIT 100`,
    values,
  );
  const matches = await Promise.all(result.rows.map(async (match: any) => ({
    id: match.id,
    dressA: await loadListing(store, match.dress_a),
    dressB: await loadListing(store, match.dress_b),
    userA: match.user_a,
    userB: match.user_b,
    status: match.status,
    proposal: match.proposal,
    acceptedBy: match.accepted_by,
    completedBy: match.completed_by,
    createdAt: new Date(match.created_at).toISOString(),
  })));
  return json(GetMatchesResponse.parse(matches));
}

async function loadMatch(client: SqlExecutor, id: string, userId: string) {
  const result = await client.query<Record<string, any>>(
    "SELECT * FROM kemis_matches WHERE id=$1 AND ($2=user_a OR $2=user_b)",
    [id, userId],
  );
  const match = result.rows[0];
  if (!match) throw new HttpError(404, "Match not found");
  const blocked = await client.query(
    "SELECT 1 FROM kemis_blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)",
    [match.user_a, match.user_b],
  );
  if (blocked.rowCount) throw new HttpError(403, "This conversation is unavailable");
  return match;
}

async function matchView(client: SqlExecutor, match: any) {
  return {
    id: match.id,
    dressA: await loadListing(client, match.dress_a),
    dressB: await loadListing(client, match.dress_b),
    userA: match.user_a,
    userB: match.user_b,
    status: match.status,
    proposal: match.proposal,
    acceptedBy: match.accepted_by,
    completedBy: match.completed_by,
    createdAt: new Date(match.created_at).toISOString(),
  };
}

async function getMessages(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
  matchId: string,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const store = deps.getStore(env);
  await loadMatch(store, matchId, userId!);
  const url = new URL(request.url);
  const values: unknown[] = [matchId];
  let cursor = "";
  if (url.searchParams.has("before")) {
    const before = url.searchParams.get("before") ?? "";
    if (!before || before.length > 160) throw new HttpError(400, "Invalid input");
    values.push(before);
    cursor = ` AND (m.created_at,m.id)<(SELECT created_at,id FROM kemis_messages WHERE id=$${values.length})`;
  }
  const result = await store.query<Record<string, any>>(
    `SELECT m.* FROM kemis_messages m WHERE match_id=$1${cursor} ORDER BY m.created_at DESC,m.id DESC LIMIT 200`,
    values,
  );
  result.rows.reverse();
  return json(GetMessagesResponse.parse(result.rows.map((message: any) => ({
    id: message.id,
    senderId: message.sender_id,
    text: message.text,
    createdAt: new Date(message.created_at).toISOString(),
  }))));
}

async function sendMessage(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
  matchId: string,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const body = SendMessageBody.parse(await request.json());
  const text = body.text.trim();
  if (!text) throw new HttpError(400, "Message cannot be blank");
  const store = deps.getStore(env);
  const result = await store.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72498301)");
    const match = await loadMatch(client, matchId, userId!);
    const messageId = body.clientRequestId ?? deps.uuid();
    const existing = await client.query<Record<string, any>>("SELECT * FROM kemis_messages WHERE id=$1", [messageId]);
    if (existing.rows[0]) {
      const message = existing.rows[0];
      if (message.sender_id !== userId || message.match_id !== matchId || message.text !== text) {
        throw new HttpError(409, "This request was already used with different details.");
      }
      return {
        id: message.id,
        senderId: userId,
        text: message.text,
        createdAt: new Date(message.created_at).toISOString(),
      };
    }
    if (match.status === "cancelled") throw new HttpError(409, "Exchange is cancelled");
    const recent = await client.query(
      "SELECT count(*)::int n FROM kemis_messages WHERE sender_id=$1 AND created_at>now()-interval '1 minute'",
      [userId],
    );
    if (Number(recent.rows[0]?.n ?? 0) >= 30) {
      throw new HttpError(429, "Too many messages. Please wait a minute.");
    }
    const inserted = await client.query<Record<string, any>>(
      "INSERT INTO kemis_messages(id,match_id,sender_id,text) VALUES($1,$2,$3,$4) RETURNING *",
      [messageId, matchId, userId, text],
    );
    const recipient = userId === match.user_a ? match.user_b : match.user_a;
    await client.query("INSERT INTO kemis_notifications(id,user_id,text) VALUES($1,$2,$3)", [
      deps.uuid(),
      recipient,
      "You have a new message about your kemis exchange.",
    ]);
    return {
      id: inserted.rows[0].id,
      senderId: userId,
      text,
      createdAt: new Date(inserted.rows[0].created_at).toISOString(),
    };
  });
  return json(SendMessageResponse.parse(result), 201);
}

async function updateExchange(
  request: Request,
  env: CloudflareEnv,
  deps: WorkerDependencies,
  matchId: string,
): Promise<Response> {
  const userId = await currentUser(request, env, deps, true);
  const input = UpdateExchangeBody.parse(await request.json());
  const store = deps.getStore(env);
  const result = await store.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72498301)");
    const match = await loadMatch(client, matchId, userId!);
    if (["completed", "cancelled"].includes(match.status)) {
      throw new HttpError(409, "This exchange is closed");
    }
    const dresses = await client.query(
      "SELECT id,status FROM kemis_listings WHERE id=ANY($1::text[]) FOR UPDATE",
      [[match.dress_a, match.dress_b]],
    );
    if (dresses.rows.some((dress: any) => ["hidden", "archived", "swapped"].includes(dress.status))) {
      throw new HttpError(409, "A dress is no longer available");
    }
    if (input.action === "propose") {
      if (match.status === "accepted") {
        throw new HttpError(409, "Cancel the accepted exchange before changing plans");
      }
      const proposal = input.proposal?.trim();
      if (!proposal) throw new HttpError(400, "Add a meeting place and time");
      if (match.status === "proposed" && match.proposal === proposal) {
        return matchView(client, match);
      }
      match.proposal = proposal;
      match.accepted_by = [];
      match.completed_by = [];
      match.status = "proposed";
    } else if (input.action === "accept") {
      if (!["proposed", "accepted"].includes(match.status)) {
        throw new HttpError(409, "Propose an exchange first");
      }
      if (input.expectedProposal !== match.proposal) {
        throw new HttpError(409, "The proposal changed. Review the latest plan before accepting.");
      }
      if (match.accepted_by.includes(userId)) return matchView(client, match);
      match.accepted_by.push(userId);
      if (match.accepted_by.length === 2) {
        const conflict = await client.query(
          "SELECT 1 FROM kemis_matches WHERE id<>$1 AND status='accepted' AND (dress_a=ANY($2::text[]) OR dress_b=ANY($2::text[]))",
          [matchId, [match.dress_a, match.dress_b]],
        );
        if (conflict.rowCount) {
          throw new HttpError(409, "A dress has already been reserved for another swap");
        }
        match.status = "accepted";
        await client.query(
          "UPDATE kemis_listings SET status='reserved' WHERE id=ANY($1::text[])",
          [[match.dress_a, match.dress_b]],
        );
      }
    } else if (input.action === "complete") {
      if (match.status !== "accepted" || match.accepted_by.length !== 2) {
        throw new HttpError(409, "Both people must accept before confirming completion");
      }
      if (match.completed_by.includes(userId)) return matchView(client, match);
      match.completed_by.push(userId);
      if (match.completed_by.length === 2) {
        match.status = "completed";
        await client.query(
          "UPDATE kemis_listings SET status='swapped' WHERE id=ANY($1::text[])",
          [[match.dress_a, match.dress_b]],
        );
        await client.query(
          "UPDATE kemis_matches SET status='cancelled' WHERE id<>$1 AND status IN ('matched','proposed') AND (dress_a=ANY($2::text[]) OR dress_b=ANY($2::text[]))",
          [matchId, [match.dress_a, match.dress_b]],
        );
      }
    } else if (input.action === "cancel") {
      if (match.completed_by.length) {
        throw new HttpError(409, "A participant has confirmed handoff. Report a problem instead of cancelling.");
      }
      if (match.status === "accepted") {
        await client.query(
          "UPDATE kemis_listings SET status='active' WHERE id=ANY($1::text[]) AND status='reserved'",
          [[match.dress_a, match.dress_b]],
        );
      }
      match.status = "cancelled";
      await client.query(
        "DELETE FROM kemis_swipes WHERE (offered_id=$1 AND target_id=$2) OR (offered_id=$2 AND target_id=$1)",
        [match.dress_a, match.dress_b],
      );
    }
    await client.query(
      "UPDATE kemis_matches SET status=$2,proposal=$3,accepted_by=$4,completed_by=$5 WHERE id=$1",
      [matchId, match.status, match.proposal, match.accepted_by, match.completed_by],
    );
    const recipient = userId === match.user_a ? match.user_b : match.user_a;
    await client.query("INSERT INTO kemis_notifications(id,user_id,text) VALUES($1,$2,$3)", [
      deps.uuid(),
      recipient,
      `Your exchange was updated: ${input.action}.`,
    ]);
    return matchView(client, match);
  });
  return json(UpdateExchangeResponse.parse(result));
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function createCloudflareWorker(dependencies: WorkerDependencies = createRuntimeDependencies()) {
  return {
    async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        const origin = request.headers.get("origin");
        if (
          !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
          origin &&
          new URL(origin).host !== url.host
        ) {
          return json({ error: "Cross-origin request rejected" }, 403);
        }
        if (request.method === "OPTIONS") return new Response(null, { status: 204 });
        try {
          if (url.pathname === "/api/__clerk" || url.pathname.startsWith("/api/__clerk/")) {
            return await clerkProxy(request, env);
          }
          if (request.method === "GET" && url.pathname === "/api/healthz") {
            return json({ status: "ok" });
          }
          if (request.method === "GET" && url.pathname === "/api/community") {
            const result = await dependencies.getStore(env).query(
              "SELECT (SELECT count(*)::int FROM kemis_listings WHERE status='active' AND NOT demo) dresses,(SELECT count(*)::int FROM kemis_matches WHERE status='completed') swaps,(SELECT count(DISTINCT p.neighborhood)::int FROM kemis_profiles p JOIN kemis_listings l ON l.owner_id=p.id WHERE l.status='active' AND NOT l.demo) neighborhoods",
            );
            return json(result.rows[0] ?? { dresses: 0, swaps: 0, neighborhoods: 0 });
          }
          if (url.pathname === "/api/profile") return await handleProfile(request, env, dependencies);
          if (request.method === "GET" && url.pathname === "/api/listings") {
            return await getListings(request, env, dependencies);
          }
          if (request.method === "POST" && url.pathname === "/api/listings") {
            return await createListing(request, env, dependencies);
          }
          if (request.method === "POST" && url.pathname === "/api/swipes") {
            return await swipeDress(request, env, dependencies);
          }
          if (request.method === "GET" && url.pathname === "/api/matches") {
            return await listMatches(request, env, dependencies);
          }
          const messagesMatch = url.pathname.match(/^\/api\/matches\/([^/]+)\/messages$/);
          if (messagesMatch && request.method === "GET") {
            return await getMessages(request, env, dependencies, decodeURIComponent(messagesMatch[1]));
          }
          if (messagesMatch && request.method === "POST") {
            return await sendMessage(request, env, dependencies, decodeURIComponent(messagesMatch[1]));
          }
          const exchangeMatch = url.pathname.match(/^\/api\/matches\/([^/]+)\/exchange$/);
          if (exchangeMatch && request.method === "POST") {
            return await updateExchange(request, env, dependencies, decodeURIComponent(exchangeMatch[1]));
          }
          const listingMatch = url.pathname.match(/^\/api\/listings\/([^/]+)$/);
          if (request.method === "GET" && listingMatch) {
            const store = dependencies.getStore(env);
            const item = await loadListing(store, decodeURIComponent(listingMatch[1]));
            const userId = await currentUser(request, env, dependencies);
            const participant = userId
              ? await store.query(
                  "SELECT 1 FROM kemis_matches WHERE (dress_a=$1 OR dress_b=$1) AND ($2=user_a OR $2=user_b) AND status IN ('accepted','completed')",
                  [item.id, userId],
                )
              : { rowCount: 0, rows: [] };
            if (
              (item.status !== "active" && item.ownerId !== userId && !participant.rowCount) ||
              (userId &&
                (await store.query(
                  "SELECT 1 FROM kemis_blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)",
                  [userId, item.ownerId],
                )).rowCount)
            ) {
              throw new HttpError(404, "Dress not found");
            }
            return json(GetListingResponse.parse(item));
          }
          if (request.method === "POST" && url.pathname === "/api/storage/uploads") {
            return await uploadPhoto(request, env, dependencies);
          }
          const photoMatch = url.pathname.match(/^\/api\/storage\/objects\/uploads\/([^/]+)$/);
          if (["GET", "HEAD"].includes(request.method) && photoMatch) {
            return await servePrivatePhoto(request, env, dependencies, photoMatch[1], request.method === "HEAD");
          }
          const deletePhotoMatch = url.pathname.match(/^\/api\/storage\/uploads\/([^/]+)$/);
          if (request.method === "DELETE" && deletePhotoMatch) {
            return await deleteUpload(request, env, dependencies, deletePhotoMatch[1]);
          }
          return json({ error: "Not found" }, 404);
        } catch (error) {
          return failure(error);
        }
      }

      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Wub Tibeb Cloudflare Worker is running. Configure static assets to serve the website.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    },
  };
}

export default createCloudflareWorker();
