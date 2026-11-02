---
name: Cloudflare Workers compatibility dates
description: Wrangler's bundled local workerd runtime can lag the current calendar date.
---

Set a Worker compatibility date no later than the newest date supported by the bundled local workerd binary, then advance it after updating Wrangler/runtime support.

**Why:** A date equal to the current date can pass Wrangler's config parsing and dry-run bundling but prevent the local Worker runtime from starting when workerd is a few days behind.

**How to apply:** After changing Wrangler or Workers runtime configuration, verify both `wrangler deploy --dry-run` and `wrangler dev --local`; the dry run alone does not catch this mismatch.
