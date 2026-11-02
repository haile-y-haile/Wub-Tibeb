---
name: OpenAPI code generation
description: Non-obvious constraints when regenerating Orval clients and running bundled API tests in this pnpm workspace.
---

**Rule:** Keep OpenAPI response component names distinct from operation-generated Zod response names. In bundled API tests, resolve transitive dependencies from the direct parent package (for example, Express) rather than the workspace root.

**Why:** Orval can successfully generate files and then fail the chained library typecheck when a response component collides with its generated schema. Pnpm's isolated dependency layout also means a transitive package may not resolve from the test bundle's own directory even though it is installed in the parent's dependency tree.

**How to apply:** After changing OpenAPI, run the workspace codegen command and its library typecheck. If a package binary is missing after a lockfile refresh, restore workspace links with `pnpm install --frozen-lockfile`; when testing transitive versions, resolve them relative to the direct parent package.
