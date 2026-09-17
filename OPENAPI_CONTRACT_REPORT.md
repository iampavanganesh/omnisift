# OmniSift — OpenAPI Contract Report

Closes the one item left open by the production-hardening pass: turning
`packages/api-contracts/openapi.yaml` from an accurate **route inventory** into a usable
**contract**.

Scope rule held throughout: **contract documentation only.** No endpoint path, method,
request-validation behaviour, response shape, status code, auth/guest behaviour, error
behaviour or database behaviour was changed. No Prisma migration. No frontend change.
Where runtime behaviour and a tidy schema disagreed, the behaviour was documented as-is and
reported — see §8.

---

## 1. Routes covered

| | Before | After |
|---|---|---|
| Paths / operations | 37 / 44 | 37 / 44 |
| Controllers | 18 known | **19** (the audit found `ConfigController`, missed by the earlier glob because it isn't under `presentation/controllers/`) |
| Live routes reconciled against the router | not checked | **45** (44 documented + 1 deliberately excluded) |

`GET /api/v1/products/comparison` is the deliberate exclusion — a deprecated alias marked
`@ApiExcludeEndpoint()`. The validator knows about it by name, so it can neither be silently
dropped nor silently resurrected.

No route was added, removed, renamed or re-versioned.

## 2. Request schemas — 12 / 12

Every operation that accepts a body now documents it: register, login, google, refresh,
forgot-password, affiliate click, alert create, alert toggle, device-token register,
device-token unregister, profile update, wishlist add.

**Derived, not duplicated.** Schemas are generated from the same Zod schemas
`ZodValidationPipe` validates with, via `src/shared/openapi/zod-schema.ts`
(`zod-to-json-schema`, `target: 'openApi3'`). The contract therefore cannot drift from
validation. Constraints carried through verbatim: `required` vs optional, defaults, min/max,
`format: email|uuid`, regex `pattern`, enums, `nullable`.

Query parameters rose from **22 → 56**: previously only path params and the handful of raw
`@Query('x')` values appeared, because Zod-validated query objects arrive as a single
parameter and were invisible. `ApiZodQuery` explodes an object schema into one parameter per
property.

Two deliberate conversion rules, both accuracy fixes found by inspecting real output before
wiring anything:

- **`additionalProperties: false` is stripped.** The converter emits it for every
  `z.object()`, but Zod's default object behaviour is *strip*, not *strict* — unknown keys
  are silently dropped, never rejected. Leaving it in would document a validation rule the
  server does not enforce.
- **`ZodEffects` is documented by its input type.** `catalogDetailSchema.brands` and
  `.specs` are `.transform()`ed into an array/record internally, but a caller sends encoded
  **strings** — the contract describes the wire, not the parsed value.

`.refine()` cannot be expressed in JSON Schema. The one cross-field rule in the codebase
("targetPrice required and > 0 when type is BELOW_TARGET") is stated in the operation
`description`, never faked with `if`/`oneOf`. A test asserts it is not faked.

## 3. Response schemas — 42 / 44 (and the other 2 are correct)

Every operation returning a body documents it against a real component schema, wrapped in
the **true** `{ success, data, meta }` envelope rather than a flattened payload — `data` is a
`$ref` (or an array of one) and `meta` is the specific shape that route actually builds.

The 2 operations without a 2xx body schema are the affiliate redirects, which return
**302 with no body**. Documented as `302` + Location. That is accurate, not a gap.

**154 error responses** documented, all against the single real error shape the global
filter emits (`{ success:false, error:{ code, message }, requestId }`), with `code` from the
real 8-value `ErrorCode` enum. Only failures an endpoint can actually produce are attached:
400 validation, 401 auth, 404 not-found, 422 business-rule, 502 provider — plus 429 and 500
on every route, because the throttler and exception filter are global.

## 4. Reusable components — 41 schemas (from 0)

Response DTOs are referenced, not inlined, so nothing repeats across paths. The audit found
all 18 existing response DTOs were **already** fully `@ApiProperty`-annotated — they produced
nothing only because no route referenced them. It also confirmed empirically (by reading
compiled `_OPENAPI_METADATA_FACTORY` output) that the Swagger CLI plugin already expands
inline object-literal types correctly, so the four rich DTOs needed **no refactoring** — a
risk assumed at planning time and disproved before any code was written.

Genuinely opaque fields were found the same way, by scanning for `type: () => Object`: only
`omni` on the comparison and product-detail DTOs (an imported interface). Those now point at
a documentation-only `OmniTakeDto`. Added doc-only classes: `ApiErrorResponseDto`,
`OkResultDto`, `MarkedResultDto`, `OmniTakeDto`/`OmniReasonDto`, `CategoryFacetDto`,
`PriceGraphResponseDto`, `MostSearchedProductDto`, `RuntimeConfigResponseDto`, plus 8 small
meta classes for the genuinely repeated `meta` shapes. **None of them changed a return
value** — controllers return exactly what they returned before.

## 5. Auth / public coverage — 18 authenticated, 26 public

Unchanged from before this work, and now visible per operation. The 18 secured operations are
exactly: affiliate (2), price-alerts (4), device-tokens (2), notifications (3), users (2),
wishlist (4), auth/logout (1).

The guest policy is intact and now documented per route: Home/discovery, Search, Categories,
Brands, Products, Compare, Price history and Deals are all public — including **both
affiliate redirect routes**, which must stay public because the public web product pages use
them. Nothing public was documented as requiring auth, and nothing authenticated was
documented as public.

## 6. Pagination — documented as finite

`GET /search` documents `page` with a real `maximum` of `PAGINATION.MAX_PAGES - 1` (3) taken
from the Zod schema, plus `meta.hasMore` described as "the ceiling has not been reached AND
this page returned results". Exceeding the ceiling is a 400, not an empty page. Nothing
implies infinite scroll. A test pins the ceiling.

Other paged endpoints document what they really return: `/affiliate/clicks` (`page`,
`pageSize` → `meta.page`, `meta.hasMore`), catalog detail (`page`, `pageSize`), and the
list endpoints that return everything with `meta.count`.

## 7. Affiliate schema coverage

- `POST /affiliate/clicks` — body is `productId` + `platform` **only**. There is no
  destination-URL field, and the description states that the server resolves the real
  `ProductListing` and **fails closed with 404** when none exists. A test asserts the
  serialized schema contains no `targetUrl` and, more strongly, no `url` at all.
- Both redirect routes — documented as **path parameters only**, 302 + Location, with an
  explicit statement that no endpoint anywhere accepts a caller-supplied destination.
- `GET /affiliate/clicks` — `targetUrl` on each row is documented as the server-resolved URL
  recorded at click time, never a client-supplied value.

No API shape was introduced that accepts a client-controlled redirect destination.

## 8. Inconsistencies found — reported, not "fixed"

Both were found by verification, are **pre-existing**, and were deliberately left alone
because changing them would be an API/product behaviour change.

**8.1 `GET /config` does not use the response envelope — and the web client silently breaks
on it.** Verified live: the endpoint returns `{"maxApiCalls":2,"priceGraphEnabled":false}` at
the top level, while every other route returns `{ success, data, meta }`. There is no global
response interceptor. Consequence:

- **Flutter is fine** — it reads `res.data['maxApiCalls']`, i.e. the whole body.
- **Web is broken** — `apiClient.get()` returns `(await request()).data`, and this body has
  no `.data`, so `getConfig()` resolves to `undefined`. `config?.priceGraphEnabled` is
  therefore always falsy, so the web product page would never show the price-history chart
  even with the runtime flag on. Masked today only because the flag is off.

Documented as-is (`RuntimeConfigResponseDto`, marked "unwrapped — no envelope"). **Fixing it
needs a product decision**: either wrap `/config` (breaks Flutter's current parsing) or fix
web's `getConfig()` to bypass the envelope unwrap. Not mine to choose.

**8.2 Malformed ids on the affiliate redirects surface as 500, not 404.** A well-formed but
unknown UUID correctly returns 404; a malformed one (e.g. `nope`) reaches the database driver,
which rejects it before the null-check, producing 500 `INTERNAL_ERROR`. **The security
property is unaffected** — verified that neither case emits a `Location` header. Documented in
both operation descriptions; adding input validation would change request-validation
behaviour, which is out of scope here. Worth noting the P0.1 unit test masked this, because
its fake repository returns `null` where real Prisma throws.

## 9. Tests and validation

**`scripts/validate-openapi.ts`** (`npm run openapi:validate`, wired into `backend-ci.yml`) —
boots the real application and fails on: a **stale** committed YAML, a served route
**missing** from the document, a documented route that is **fabricated** (not served), an
unresolved `$ref` or security scheme, or **non-deterministic** generation (it generates twice
and compares). Result:

```
OpenAPI contract OK — 37 paths / 44 operations, 41 schemas,
45 live routes matched, deterministic, no broken refs.
```

I verified the validator actually fails rather than just printing OK: injecting a renamed path
produced all three expected errors (stale, missing `GET /api/v1/deals`, fabricated
`GET /api/v1/deals-FAKE`), then the file was restored.

**`test/unit/openapi-schemas.spec.ts`** — 16 schema-regression tests over the critical APIs
named in the brief (search, product/catalog, compare, price history via the catalog schema,
wishlist, alerts, affiliate), asserting real constraints: the search page ceiling, the
affiliate body having no URL field, the alert enum/uuid/nullable shape, wishlist requiredness
and defaults, wire-typing of transformed params, the `additionalProperties` rule, absence of
`$ref`/`$schema`, and that memoisation returns the identical object.

**Full suite:** backend **58 tests** (was 42) across 12 files, all passing; `nest build`
clean; web typecheck/lint/6 tests clean; `flutter analyze` 0 errors; `flutter test` passing.

**Two build issues hit during final verification, both in `apps/web`, both handled:**

- **Fixed (mine):** `next build` began failing with `__dirname is not defined in ES module
  scope`. Next compiles `next.config.ts` to CJS or ESM depending on the resolved dependency
  tree, and adding vitest to `apps/web` (approved separately) shifted it to ESM, where the
  config's `path.join(__dirname)` is invalid. Changed to `path.resolve(process.cwd())`, which
  is valid under both module systems and equivalent for every entry point that loads the
  config. Verified the config now loads (`✓ Running next.config.ts`).
- **Environmental, not code:** after that fix, Turbopack fails on this machine because
  Windows Application Control is blocking Next's native binary
  (`@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node`), so Next falls back to WASM, which
  Turbopack does not support. Confirmed the application itself still builds correctly via the
  documented fallback (`next build --webpack` produced the full route table with ISR intact).
  That flag was **not** committed — CI runs `ubuntu-latest` with Linux bindings and is
  unaffected. Earlier builds in this same session succeeded, so the block is new on this host.

**Backend lint now passes with 0 errors** — it had been failing since P0 because I ran
`npm test` and `npm run build` in earlier phases but never `npm run lint`, and `backend-ci.yml`
runs lint. All 29 errors were in test files I wrote (28 × `require-await` on async test
doubles, 1 unused import). Fixed by removing the unused import and adding a **test-scoped**
`require-await: off` override with a written justification — production code keeps the rule.
No assertion was weakened and no behaviour was mocked away.

**Per-request cost (constraint 1):** conversion runs at decorator evaluation, i.e. once at
module load. `zodToOpenApi` memoises per schema object in a `WeakMap`, so schemas shared by
two routes (`comparisonSchema`, `catalogDetailSchema`, `mostSearchedSchema`,
`deviceTokenSchema`) convert once. Verified two ways: a grep confirms nothing outside
`src/shared/openapi/` references the converter, so no service or handler can reach it; and a
test asserts repeated calls return the identical object.

## 10. Files changed

**New — helpers (`src/shared/openapi/`)**: `zod-schema.ts`, `api-zod.decorator.ts`,
`api-envelope.decorator.ts`, `api-errors.decorator.ts`.

**New — doc-only DTOs**: `shared/dto/error-response.dto.ts`, `shared/dto/common-response.dto.ts`,
`shared/dto/omni-take.dto.ts`, `modules/config/runtime-config-response.dto.ts`,
`modules/products/application/dto/category-facet-response.dto.ts`,
`modules/price-snapshots/application/dto/price-graph-response.dto.ts`,
`modules/discovery/application/dto/most-searched-response.dto.ts`,
`modules/products/presentation/validators/catalog-detail.docs.ts`.

**New — tooling/tests**: `scripts/validate-openapi.ts`, `test/unit/openapi-schemas.spec.ts`.

**Modified**: all 19 controllers (decorators only — no handler body touched), the 2 DTOs with
`omni` (an explicit `type` on one `@ApiProperty`), `package.json` (+`zod-to-json-schema`
dependency, +`openapi:validate` script), `eslint.config.mjs` (test-scoped rule override),
`.github/workflows/backend-ci.yml` (validation step + a Postgres service, because boot opens a
Prisma connection), `packages/api-contracts/README.md`, `packages/api-contracts/openapi.yaml`
(regenerated), `test/unit/runtime-config.service.spec.ts` (unused import).

**Dependency added**: `zod-to-json-schema@3.25.2` — zero runtime dependencies, peer
`zod ^3.25.28 || ^4` (installed: 3.25.76). It is a regular dependency rather than a
devDependency because `/docs` and the exported YAML must come from one document, so
conversion happens during decorator evaluation at boot.

---

## Status

The OpenAPI contract is **complete for all 44 operations**: every operation has a
description, real parameters, a documented success response (or a documented 302), and real
error responses; all 12 body-taking operations have request schemas derived from live Zod
validation. The two remaining open items are the **reported inconsistencies in §8**, which
need product decisions, and **client-code generation**, which is deliberately a separate
project — both consumers still hand-write their models.
