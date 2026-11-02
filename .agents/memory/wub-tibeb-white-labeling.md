---
name: Wub Tibeb white-labeling
description: The user wants the Wub Tibeb website to have no visible Replit branding.
---

The published site's floating Replit badge is injected by the hosting platform through an external script, not rendered by Wub Tibeb's application source. Hiding it with app CSS is not a reliable or appropriate fix. Replit's publishing settings can disable the badge on eligible plans; otherwise, removing it requires hosting the website elsewhere. The active account plan may not be visible to the app agent.

**Why:** The user explicitly requested a Wub Tibeb-branded website with no visible Replit mentions, and source-only edits cannot remove the host-injected badge.

**How to apply:** For future white-label work, first check the Publishing settings and account plan. If the setting is unavailable, present a hosting migration path while preserving the custom domain, Clerk, PostgreSQL data, and private photos; do not claim the badge was removed by changing app code.
