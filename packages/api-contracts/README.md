# @omnisift/api-contracts

**Single source of truth for the API contract = `openapi.yaml`.**

Do NOT put shared TypeScript models here — backend is TS, client is Dart; they cannot
import the same package. The contract is the OpenAPI document, not code.

## How `openapi.yaml` is produced

```bash
cd apps/backend && npm run export:openapi
```

That builds the app and runs `apps/backend/scripts/export-openapi.ts`, which boots the full
Nest application (no HTTP listener) and serialises the document built by
`apps/backend/src/bootstrap/swagger.ts` — the *same* `DocumentBuilder` config the in-app
`/docs` UI uses. There is deliberately no second, divergent Swagger configuration.
Regenerate after adding or changing a route; do not hand-edit the YAML.

## Current state

- ✅ **Routes** — all 37 paths / 44 operations across 19 controllers, with real path and
  query parameters, tags, and bearer-auth requirements.
- ✅ **Request schemas** — all 12 operations that take a body document it, **derived from the
  Zod schema that actually validates the request** (`src/shared/openapi/zod-schema.ts`), so
  the contract cannot drift from validation. 56 parameters documented.
- ✅ **Response schemas** — 42/44 operations document a 2xx body against a real component
  schema, wrapped in the true `{ success, data, meta }` envelope. The 2 without are the
  affiliate redirects, which return **302 with no body** — correct, not a gap.
- ✅ **Reusable components** — 41 schemas, no duplicated inline payloads.
- ✅ **Errors** — 154 documented error responses, all against the one real error shape the
  global filter emits.
- ⚠️ **Nothing generates client code from this file yet.** Both consumers still hand-write
  their models (`apps/web/src/lib/types.ts`, `apps/client/lib/**/infrastructure/models/`).
  Migrating them is deliberately a separate project.

Constructs Zod can express but JSON Schema cannot — notably `.refine()` cross-field rules,
such as "targetPrice is required when type is BELOW_TARGET" — are written in the operation
`description` rather than invented as schema constructs.

## Verifying it

```bash
cd apps/backend && npm run openapi:validate
```
Boots the real app and fails if the committed YAML is stale, if a served route is missing
from it, if it documents a route that does not exist, if a `$ref` or security scheme is
unresolved, or if generation is non-deterministic. Runs in `backend-ci.yml`.

Note: generation and validation both boot the application, and boot opens a Prisma
connection — so both need a reachable database (an empty one is sufficient).

See `OPENAPI_CONTRACT_REPORT.md` for coverage numbers and the known inconsistencies this
work surfaced.
