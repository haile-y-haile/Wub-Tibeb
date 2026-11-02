# Wub Tibeb website hosting migration readiness

This is a source-level migration checklist only. It creates no infrastructure, changes no DNS, and does not export or modify production data. Confirm current provider terms and prices before choosing a target.

## Current website architecture

- **Web:** `artifacts/kemis-swap` is a React 19 + Vite single-page app with Wouter routing, Amharic/English UI, PWA manifests, and a service worker. It calls the API using same-origin `/api` paths.
- **API:** `artifacts/api-server` is a Node.js / Express 5.3 service mounted under `/api`. It uses Clerk middleware, PostgreSQL, and Replit's object-storage sidecar.
- **API contract:** `lib/api-spec/openapi.yaml` is the source of truth; `pnpm --filter @workspace/api-spec run codegen` generates the client hooks and server Zod validators.
- **Database:** `lib/db` uses PostgreSQL and Drizzle. Source migrations currently include `0001_kemis.sql` and `0002_exchange_attempts.sql`. This document does not establish which migrations are applied in production.
- **Authentication:** Clerk handles email and Google sign-in. Phone/SMS sign-in is not active. PostgreSQL member IDs are Clerk user IDs; changing Clerk tenants or user IDs requires an explicit identity-mapping plan.
- **Photos:** uploads are private objects addressed through `/api/storage/objects/uploads/<id>`. The API checks the member's ownership and listing/match visibility; do not replace these with public bucket URLs.

## Migration sequence

### 1. Choose separately hosted components

Cloudflare Pages can serve the static web build, but it is not a drop-in host for this long-running Express server, PostgreSQL database, or current Replit storage sidecar. Select and validate:

- A Node.js host that supports the current Express runtime and persistent environment variables.
- A PostgreSQL provider with backups, SSL, connection limits suitable for the API, and a tested restore process.
- Durable private object storage with authenticated server access, MIME metadata, and lifecycle/export tooling.
- The existing Clerk application or an owner-approved Clerk migration plan.

Do not assume the complete stack can run indefinitely at zero cost. Cloudflare's static frontend may fit a free allowance; API compute, database compute/storage, object operations, data transfer, authentication limits, and backups have separate quotas and may be billed. Verify each provider's current terms before migration.

### 2. Back up and move PostgreSQL

- Schedule a write freeze or a final synchronization window.
- Use the owner-controlled database credentials to create an encrypted `pg_dump`; never place a database URL or dump in Git.
- Restore the dump into a non-production target database first. Verify row counts, primary/foreign keys, unique indexes, JSON listing data, notification/report records, and the migration history.
- Apply missing schema migrations to staging with the repository's migration process. Do not run `push-force` against production.
- Confirm that profile IDs still map to the same Clerk user IDs. If identity IDs change, create and verify a mapping before cutover.
- Keep the previous database read-only and recoverable until the owner validates the target.

### 3. Move photo objects without exposing them

- Export every object referenced by `kemis_uploads` and every listing's `data.photos` paths.
- Record object size, MIME type, and a checksum; compare counts and checksums after import.
- Keep objects private. Preserve the API-mediated access checks and 2 MB/type validation rather than pointing listing pages directly at a public bucket.
- Either preserve each existing object path or update all database references in a reviewed migration. Test images on active listings, matched exchanges, archived listings, and moderator reports before cutover.
- Replace Replit sidecar access with the target provider's server-side credentials in the host's secrets manager. Never commit those credentials.

### 4. Configure the Node API and secrets

The source currently reads these deployment variable **names**; values must be entered through the destination's secrets manager:

- API/runtime: `PORT`, `NODE_ENV`, `LOG_LEVEL`, `DATABASE_URL`
- Clerk API: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Web build: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PROXY_URL`
- Current Replit storage integration: `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS` (replace these with the target storage configuration; do not copy Replit sidecar assumptions)
- Replit-specific or test-only variables such as `REPL_ID`, `BASE_PATH`, `BASE_URL`, `HARNESS_URL`, `PROD`, and PostgreSQL tuning flags must be reviewed rather than copied blindly.

Keep the API's `/api` base path. The app rejects cross-origin state-changing requests, so the preferred cutover is a same-origin Cloudflare route for `/api/*` to the Node API, preserving the original host/protocol and session cookies. If the API is placed on a separate origin instead, redesign and test CORS, cookies, Clerk proxying, CSRF protection, and frontend API configuration before launch.

### 5. Configure Cloudflare Workers and the domain

- Build the existing web artifact with the intended root `BASE_PATH`; the current canonical origin is `https://wubtibeb.com`.
- Configure SPA fallback for actual app routes, while keeping `/api/*`, `/robots.txt`, `/sitemap.xml`, `/ads.txt`, icons, manifests, and service-worker files mapped to their real resources.
- The staging Worker can serve Vite static assets and a same-origin `/api/*` subset. Do not route unsupported API endpoints to production.
- Set the apex/`www` canonical redirect, TLS, and Cloudflare proxy/routing from the owner-controlled dashboard. This source change does not attach domains or change DNS.
- Test the service worker and installation after moving to the root path; its cache scope and asset URLs must not retain the old Replit artifact prefix.

### Cloudflare staging implementation status — November 2, 2026

The website build has been verified locally with:

```sh
PORT=25077 BASE_PATH=/ pnpm --filter @workspace/kemis-swap run build
```

Source now includes a Cloudflare Workers entry point, Wrangler configuration, a Vite staging build script, and an isolated Hyperdrive/R2 binding contract. It implements health, community counts, listing discovery/detail/create, profile read/write, Clerk's same-origin frontend API proxy, and private R2 photo upload/read/delete endpoints. The API uses the existing `kemis_*` PostgreSQL tables and imports the shared Drizzle schema. Upload validation checks declared type, actual image signature, a streamed 2 MB cap, per-user hourly quota, ownership, blocked-user visibility, and metadata-write orphan cleanup.

This is a **partial source port, not a deployed or production-ready migration**. Swipes, exact reciprocal garment matching, match listing, private messaging, and proposal/acceptance/completion/cancellation are ported. Notifications are currently written for match/chat/exchange events, but the read/mark-read endpoints are not ported. Reports, blocks, moderation, listing edit/archive, and tutorial media are not ported. Do not point the frontend at the Worker until these flows are implemented and verified; the current UI still calls these endpoints. Replit Express production code remains unchanged.

The Worker can be compiled locally using Wrangler without connecting to a database or Cloudflare account. A staging website build requires a real Clerk *staging* publishable key in `artifacts/kemis-swap/.env.cloudflare.local`; the Worker requires staging-only Clerk keys, an isolated PostgreSQL database connected through a Hyperdrive binding, and an R2 bucket. No Cloudflare project, bucket, Hyperdrive config, Clerk app, secret, deployment, custom-domain attachment, or DNS change was made here.

The checked-in Wrangler config contains a dummy Hyperdrive ID and a local-only PostgreSQL URL. Before any deployment, the owner must create/configure isolated staging resources and replace the ID and bucket name. Use `pnpm --filter @workspace/api-server run db:staging:migrate` only with `WUB_TIBEB_STAGING_DATABASE_URL` pointing to the new staging database and `WUB_TIBEB_CONFIRM_STAGING=yes`. The scripts never fall back to `DATABASE_URL` and refuse a Replit-hosted target. Data export/import commands operate only on the separately named staging URL; they do not export the paused production database. For production preservation, obtain an owner-approved provider backup/export through its supported recovery path, then review it and import into a fresh staging database. Photo bytes need a separate owner-managed backup/transfer; no production storage was accessed.

After completing route parity and tests, the owner can authenticate Wrangler, create the staging Hyperdrive and R2 resources, provide staging-only Clerk keys, run the schema migration, and use `pnpm --filter @workspace/api-server run cloudflare:build` followed by an owner-approved staging deploy. Keep the generated `workers.dev` hostname until sign-in, uploads, matching, chat, exchange, safety, and handoff pass. Do not attach the public domain or change DNS as part of this source-only step.

### 6. Reconnect Clerk and Google sign-in

- Keep email and Google enabled; phone sign-in is currently off.
- Add the final apex and `www` domains, sign-in/sign-up paths, callback URLs, and Clerk proxy route to the correct Clerk application.
- Verify the Google OAuth consent configuration and exact authorized redirect URI in the Google/Clerk owner dashboards.
- Do not export passwords or authentication secrets. If changing Clerk tenants, plan for stable user-ID mapping, account recovery, and migration of the linked PostgreSQL rows.

### 7. Cutover validation

Run these against staging first, then run a short owner-approved production smoke test:

- `/api/healthz` returns healthy from the public domain.
- Email registration, email sign-in, Google sign-in, sign-out, and session persistence work on apex and `www`.
- A real account uploads valid JPEG/PNG/WebP files at and below 2 MB; unsupported types and actual payloads above 2 MB are rejected before object storage. Confirm removed draft photos are cleaned only when unreferenced.
- Create and edit a listing; verify photo authorization from another account and after sign-out.
- Complete an exact two-garment reciprocal match, private messages, current-proposal bilateral acceptance, handoff confirmations, history, cancellation/rematch, reporting, blocking, and partial-handoff moderation.
- Test Amharic text rendering, Android-sized viewports, keyboard focus, install prompt, offline shell, canonical metadata, robots, sitemap, and `ads.txt`.
- Restore the backup into a separate database and re-read sample photos from the object backup.

## Cost and free-tier limitations

Replit's published documentation consulted on November 2, 2026 describes usage-based billing and plan-specific limits. It states that Starter includes one published app with a 30-day publishing limit (which can be republished), and compute/data transfer may be billed after included credits. The current published database pricing page describes production database compute/storage charges and plan-specific storage caps. App Storage has separate storage, transfer, and operation charges; it is not a guaranteed unlimited free photo host.

These figures and limits can change. Verify them in the current Replit billing pages before deciding whether to retain Replit services. Cloudflare Pages, Clerk, the chosen Node host, PostgreSQL, and object storage each have separate free-tier quotas and terms; an all-free, always-on production stack is not guaranteed.

## White-label hosting badge and low-cost migration path

- The live website response currently includes a hosting-injected `i.replit.com/script.js` badge script. It is not part of the app's React source, manifest, or artifact configuration, so CSS/source edits cannot reliably remove it.
- Replit's current plan documentation says the badge cannot be removed on Starter; Core and Pro can manage it in Publishing settings. The active account plan is not exposed by the deployment metadata checked for this audit. Do not make a plan change without the owner.
- A Cloudflare-native path now has a partial Worker implementation, but the API port is incomplete. Keep the existing Cloudflare-managed domain and Clerk tenant, complete route parity, connect an isolated PostgreSQL service through Hyperdrive, move private photo objects to R2, and verify quotas and connection behavior first; zero-cost always-on operation is not guaranteed.
- Lower-risk path: keep the current Express API shape on a low-cost Node host, use a managed PostgreSQL service and private object storage, and let Cloudflare route the existing domain's `/api/*` path to the API while serving the web build. This avoids a full Express-to-Workers rewrite but may require a paid host/database/storage plan.
- For either path, use staging first; take encrypted database and object backups; compare row counts and photo checksums; retain the original services and data until login, uploads, listings, exact-garment matching, messaging, and handoff flows pass; then cut over only with owner approval. Do not reset or delete the existing database or storage during migration.

References:

- Replit deployments: https://docs.replit.com/learn/projects-and-artifacts/replit-deployments
- Replit deployment pricing: https://docs.replit.com/billing/deployment-pricing
- Replit database billing: https://docs.replit.com/billing/about-usage-based-billing
- Replit database backups and recovery: https://docs.replit.com/features/data-and-storage/data-recovery
- Replit App Storage billing: https://docs.replit.com/billing/object-storage-billing

## Owner decisions still required

- Confirm that the official public support/privacy inbox hello@wubtibeb.com is controlled and monitored; provide the legal operator/business name, US state, and approved age-eligibility policy.
- Have qualified counsel review the privacy notice, terms, cross-border data practices, and consumer-protection obligations for a US-operated service used in Ethiopia.
- Confirm production migration state and authorize any production export/cutover separately.
- Select destination Node, PostgreSQL, and private object-storage providers and verify their costs and retention settings.
- Complete real two-account end-to-end and production authentication/photo tests before routing all users.
