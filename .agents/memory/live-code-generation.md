---
name: Live code generation
description: Avoid false browser failures while generated API modules are being replaced.
---

Complete API generation and static checks before starting a browser verification pass; do not regenerate the client in the middle of a critical journey.

**Why:** Generation removes and replaces output modules. Vite can briefly return missing-module errors to an already-open browser, and a rejected lazy import can remain cached even after generation finishes. This can look like a persistent application failure.

**How to apply:** Regenerate, finish edits, restart the affected services, then test. If a live session encounters this transient state, reload the full document after generation/restart and recheck only the failed route. Resetting a React error boundary alone does not clear a rejected lazy import.
