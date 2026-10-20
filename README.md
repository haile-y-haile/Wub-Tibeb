# Wub Tibeb · ውብ ጥበብ

**Wear. Share. Repeat.**

A working mobile-first web MVP for exchanging **Habesha kemis for Habesha kemis** in Ethiopia. The initial experience uses Addis Ababa neighborhoods. Pilot geography and handoff policy can evolve; this is not a general clothing marketplace.

The public brand is **Wub Tibeb**, with the Amharic name **ውብ ጥበብ** and exact tagline **Wear. Share. Repeat.** Naming is not a claim of verified trademark or domain availability. Internal package names, database identifiers and routes remain unchanged to preserve existing accounts, listings and exchanges.

## Included milestones

1. **Accounts, listings, discovery:** Clerk-managed sign-up/sign-in, English/Amharic interface, private profile, general neighborhood, own wardrobe create/edit/archive, up to six compressed photos, detailed garment measurements and condition, searchable/filterable public discovery.
2. **Compatibility, matching, chat:** opt-in private preferred garment measurements; indicative fit comparison; swipe left/pass or right/like with a specific owned active dress; only the exact reciprocal garment pair matches; private persistent chat.
3. **Exchange, safety, PWA:** proposal with meeting details, separate acceptance by both people, reservation of both dresses, separate completion confirmation by both people, swap history, notifications, report/block, server-enforced moderator actions, install manifest/icons, service worker and offline notice.

No payments. No fake SMS OTP. Authentication currently uses supported Clerk email registration/sign-in. Phone authentication remains unconfigured until a suitable Ethiopia-compatible provider is chosen.

## Run

Use the managed API Server and Wub Tibeb app workflows in Replit. They supply the required routing and ports. The app's internal workflow identifier remains `artifacts/kemis-swap: web`.

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen # after changing the API specification
pnpm --filter @workspace/api-server test:exchange
node scripts/check-amharic.mjs
```

The frontend is `artifacts/kemis-swap`, backend `artifacts/api-server`, OpenAPI contract `lib/api-spec/openapi.yaml`, PostgreSQL schema `lib/db/src/schema/marketplace.ts`.

Provisioned environment keys, never committed: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR`. Workflow-provided `PORT` and `BASE_PATH` are required. Clerk production proxy configuration is supplied by the publishing platform; do not hardcode development domains.

## Database and migrations

The initial SQL migration is `lib/db/migrations/0001_kemis.sql`. It was applied to the development PostgreSQL database. The matching Drizzle schema is maintained alongside it.

For a fresh **development** database, apply the migration using your PostgreSQL client, or:

```sh
pnpm --filter @workspace/db run push
```

Existing development databases must also apply `lib/db/migrations/0002_exchange_attempts.sql` (or synchronize the current schema with the development-only command above). This replaces the old permanent garment-pair uniqueness constraint with an index that allows a fresh attempt after cancellation while retaining history.

Use Replit's Publish flow for managed **production** schema changes. There is deliberately no startup-time DDL, custom production migration runner, or migration build hook. Development and production Clerk accounts are separate. Development sample data is not a production seed policy.

## First moderator

Nobody becomes an administrator just by being the first visitor. Register, verify your email, and finish your profile. An authorized project operator can then run:

```sh
pnpm --filter @workspace/api-server admin:grant owner@example.com
```

Replace the example with the verified account you own. The script resolves the actual Clerk user and requires an existing app profile. It grants access only in the environment it runs against. Production moderator access must be assigned using the production environment and that environment's verified account. No shared/default passwords are created.

Moderator UI: `/moderation`. Reports can be dismissed or their listing hidden. Blocking/hiding cancels uncompleted arrangements and releases reservations **only before anyone confirms handoff**. After a confirmed handoff, reservations are preserved for review. Blocking at that stage automatically creates a moderation report. The moderator can explicitly close that dispute and archive **both** garments; this never fabricates bilateral completion or relists a garment that may have changed hands.

## Important exchange rules

- A's dress X offered for B's dress Y matches only B's **Y offered for X**. A different dress from B cannot satisfy reciprocity.
- Server derives identity and ownership from the authenticated session, never a client-provided user ID.
- Only real, active, owned dresses can be offered. Samples cannot exchange.
- Proposal does not count as either person's acceptance. Changing a proposal clears prior acceptances.
- Acceptance must include the exact current proposal the participant reviewed. A stale proposal returns a conflict and refreshes the displayed plan.
- Cancellation clears both garment-specific likes. A new attempt requires fresh reciprocal interest, creates a distinct match, and preserves the cancelled conversation and history.
- Both people accepting reserves both garments. A garment cannot be reserved for overlapping exchanges.
- Both people must separately confirm handoff. One person's confirmation cannot complete the swap.
- Completed garments become `swapped` and leave discovery. Exchanges retain history; ownership is not silently transferred into another person's wardrobe.
- An accepted exchange cannot change meeting details without cancellation. Once anyone confirms handoff, cancellation is disabled; report problems instead.
- Listings with open matches cannot be edited until those exchanges are cancelled, preventing consent to an outdated dress. Archive cancels unaccepted matches.
- Blocking is bidirectional for discovery, messages and exchange access. Its handoff exception is described above. Reports are retained for moderators.
- Duplicate likes/acceptances/partial confirmations do not send repeated notifications. Messages are limited to 30 per member per minute; member-submitted reports to 10 per day, enforced against PostgreSQL.

## Photos, privacy, low bandwidth

Browser images are resized to at most 1200 pixels on the longest edge and compressed as WebP, with a 2 MB per-photo cap. Signed upload URLs expire after 15 minutes. Photo bytes persist in App Storage, not PostgreSQL or the app's ephemeral disk. PostgreSQL stores paths and upload ownership metadata.

Listing submissions verify upload ownership, object existence, size, MIME type and image signatures. Only photos attached to available public dresses are publicly viewable; owners and exchange participants have scoped access to other relevant photos. Short private browser caching is used for photos. A previously downloaded photo cannot be remotely erased from another device.

Only name and general neighborhood are public. Profile preferred measurements are private; **garment** measurements are public listing details. Compatibility is indicative (within 5 cm per dimension, or 10 cm in length), not a fit guarantee. Use desired garment measurements, not an unadjusted body-size recommendation.

Lists are bounded, images lazy-loaded, routes loaded on demand, and chat/notifications polled rather than using a continuous high-bandwidth connection. App-authored Amharic copy covers navigation, onboarding, supported Clerk email/password and verification/recovery screens, form placeholders, notifications, error toasts, relative dates, demonstration listings and offline pages. Amharic uses **ውብ ጥበብ** and **ይልበሱ። ያጋሩ። ይድገሙ።**; the exact English tagline stays **Wear. Share. Repeat.** Member-authored names, descriptions, messages and meeting plans remain in their authors' language. External identity-provider pages, email delivery templates and Clerk's own preview-only “Development mode” badge are provider-controlled, not app translations. Native-speaker review is recommended before a broad Amharic-language launch.

## PWA

Discovery, wardrobe, matches, notifications and moderation provide cursor pagination with “Show more” controls; chat provides “Load earlier messages.” Match detail lookup does not depend on a match being in the first history page. Compatibility filtering is applied before limiting each page, and unread notifications are queried independently of recent read alerts.

Publishing over HTTPS enables service-worker registration and browser installation support. Android Chrome offers installation when its install criteria are met; the in-app install action appears when the browser provides it. The manifest supplies 192/512 pixel and maskable icons.

The service worker stores an offline notice and small brand assets only. It does **not** cache authenticated pages, messages, profiles, API responses or authentication requests. Offline mutation queueing is intentionally absent: likes, saves, messages and exchange confirmations need an online server response.

## Demonstration data

Six development listings are labeled **Sample**, with descriptions explicitly saying they are demonstrations and photos are AI-generated. Sample profiles are not login accounts. They never auto-like or generate fake matches. The hero photos are generated editorial examples, not claims about real sellers.

For real swaps, two real members must register and each list an actual dress with their own photos.

## Verification

`test:exchange` runs a real PostgreSQL/App Storage integration test with isolated synthetic fixtures:

- persists an actual WebP upload in durable storage and reads its metadata;
- checks one-way likes and wrong-garment reciprocal interest do not match;
- checks exact reciprocal interest creates one match;
- checks ownership enforcement and outsider conversation denial;
- sends messages as each participant and verifies persistence;
- checks proposal, separate acceptances, reservation, separate completions, swapped state and retained history;
- checks repeated actions and premature completion, plus blocking.
- checks cancelled-pair rematching, preserved cancelled messages, changed-plan consent reset, rejection of stale acceptance, and no duplicate match notifications;
- checks safety cancellation before handoff, preserved reservation after one confirmation, and moderator dispute closure without fake completion or unsafe relisting.
- verifies retrieval of all 207 conversation messages across the 200-message page boundary, including timestamp ties, without overlapping or losing records.

It removes only its own test records and uploaded object. It does not create Clerk accounts or introduce any API authentication bypass.

Browser-test fixtures can be removed with `pnpm --filter @workspace/api-server test:cleanup <nonce> <Clerk ID A> <Clerk ID B>`. It defaults to dry-run; `--apply` removes only accounts with that exact synthetic email marker, their matching app records and their uploaded photos. It refuses moderators, non-fixture names, outside matches and photos referenced outside the run. Close the test browser contexts first to stop background polling. This is not a general account-deletion command.

The mobile browser check used two independent 390×844 contexts with supported programmatic Clerk test identities. It verified profile setup, UI photo uploads and listings, one-way interest without a match, exact reciprocal matching, persistent two-way chat, acceptance of the reviewed proposal, reservation, separate handoff confirmations, completed history and exclusion of both completed garments from discovery. It also checked Amharic brand/tagline, match labels/statuses, notifications and dates. A targeted follow-up verified recovery after a development module reload and all 209 test messages across the 200-message page boundary, with no duplicates.

Public API responses and unsigned private-API rejection are checked separately. **These checks do not verify real email delivery, production credentials/data, installation on a physical Android phone, or physical-device performance.** Complete those launch checks before inviting public users; programmatic test sign-in is not proof of delivery of a real verification email.
