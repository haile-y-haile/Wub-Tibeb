# Habesha Kemis Swap

Ethiopia-first, mobile-first Habesha kemis-to-kemis exchange marketplace. See README.md for operating instructions, exchange rules, privacy and verification boundaries.

## Founder-confirmed scope

- "locally in Ethiopia first"
- "only for ... the first iteration ... Habesha kemis"
- Holiday rewear, detailed size listings, reciprocal garment-specific swipe swaps.
- "most people in Ethiopia, especially in Addis Ababa, they have low-cost phone, which is Android"
- Initial request names Addis Ababa and English/Amharic; do not assume Addis-only, Amharic-first, phone OTP or a mandatory public-handoff policy are permanent founder decisions.
- No payments or fake SMS OTP. Use supported authentication until a real Ethiopia-compatible SMS provider is configured.

## Run and verify

- Managed workflows: `artifacts/api-server: API Server`, `artifacts/kemis-swap: web`.
- `pnpm run typecheck`
- `pnpm --filter @workspace/api-server test:exchange`
- `pnpm --filter @workspace/api-spec run codegen` after OpenAPI changes.
- `pnpm --filter @workspace/db run push` for development schema changes only.
- Managed production database changes go through Publish, not startup migrations.

## Decisions

- Clerk owns authentication; no local passwords or simulated test-session login.
- Private preferred garment measurements stay in profiles; public garment measurements belong on listings.
- Photos live in durable App Storage; PostgreSQL contains paths and metadata only.
- Reciprocal interest must identify the same two garments. Never simplify to profile-level likes.
- Both users separately accept and separately complete. Serialize garment state changes to prevent competing reservations.
- Demo listings are explicitly labeled and non-exchangeable; never fake messages or matching behavior.
- The service worker must never cache private API/auth/chat data.

## Source of truth

- API contract: `lib/api-spec/openapi.yaml`; generated client and validation in `lib/api-client-react` and `lib/api-zod`.
- Database: `lib/db/src/schema/marketplace.ts`; initial development migration: `lib/db/migrations/0001_kemis.sql`.
- Core exchange rules: `artifacts/api-server/src/lib/marketplace.ts`.
- Frontend: `artifacts/kemis-swap/src`; language strings: `src/lib/i18n.tsx`.
- Moderator bootstrap and test scope: README.md.
