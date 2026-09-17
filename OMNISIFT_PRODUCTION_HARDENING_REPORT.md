# OmniSift — Production Hardening Report

Scope: the production-hardening pass across `apps/backend`, `apps/web`, `apps/client`,
`packages/`, and `.github/workflows/`, executed in three approved phases (P0 → P1 → P2).

Constraints held throughout: no architecture rebuild · no new runtime infrastructure
(no Redis/queues/microservices) · no invented features or fabricated data · no UI redesign ·
guest access preserved · 7-day/24-hour freshness preserved · chart-colour exception preserved ·
affiliate-redirect security preserved · Prisma schema untouched · no test weakened to pass.

**The Prisma schema was never modified and no migration was created.** Every fix was new
backend logic over the existing schema, frontend code, CI, docs, or tests.

---

## 1. Executive summary

| Area | Before | After |
|---|---|---|
| Affiliate click endpoint | Persisted the client-supplied `targetUrl` verbatim | Re-derives the URL from a real `(product, seller)` row; **fails closed** when none exists |
| Flutter affiliate taps | Launched the raw provider URL directly, no revalidation | Routed through the backend-resolved redirect wherever a real `productId` exists |
| Price alerts | Purely reactive — could silently never fire if nobody revisited the product | Hourly scheduled refresh for products with an **active alert**, batch-capped |
| Compare-by-product refresh | Silently emitted **no** alert/snapshot events | Emits the same events the live compare flow does (real bug, found and fixed) |
| `openapi.yaml` | 7-line stub, `paths: {}`, 0 of 37 routes | All 37 routes, real params/tags/security, generated from the existing Swagger config |
| `npm audit` in CI | `\|\| true` — could never fail | Real gate; 24 → 12 findings, the rest triaged and documented |
| `apps/web` CI | None | `web-ci.yml`: typecheck → lint → test → build |
| Flutter CI | analyze + test | + `flutter build web` |
| Product JSON-LD | Fabricated `availability: InStock`, hardcoded `priceCurrency: "INR"` | `availability` omitted; currency read from the real seller row; regression-tested |
| Image ingestion | No HTTPS check, no size cap, no type validation, redirects unvalidated | HTTPS-only · streamed byte cap · magic-byte verified · per-hop SSRF guard |
| Search pagination | Client guessed "more available" from list emptiness | Backend returns real `meta.hasMore`; both Flutter controllers read it |
| Deals copy | Claimed validation against "typical average" price that does not exist | Describes what the data actually is (discount off list price) |
| Backend tests | 1 | 42 (+ 6 web, + 1 Flutter) |

---

## 2. P0 — critical

### P0.1 Affiliate redirect security
**Backend** — `POST /affiliate/clicks` no longer accepts or stores a client-supplied
destination. `RecordClickInput` lost its `targetUrl` field entirely (compile-time guarantee);
`PrismaAffiliateClickRepository.record()` resolves the real `ProductListing` for the
`(productId, platform)` pair and throws `NotFoundError` when there isn't one, rather than
falling back to anything the caller asserted. Added
`GET /affiliate/go/product/:productId/platform/:platform` beside the existing
`…/seller/:sellerId` route — both path-params-only, both server-resolved.

**Flutter** — `product_detail_screen.dart` and `product_compare_screen.dart` now launch the
backend redirect whenever a real catalog `productId` is known. Pre-catalog search results
still open the raw provider URL directly on the client (unchanged, deliberate): no OmniSift
endpoint accepts it and it is never persisted as a trusted destination. `product_compare_screen`
additionally now records the click, which it never did before.

*Deviation from the literal plan, flagged at the time:* rather than plumbing a new `sellerId`
through `ComparisonResponseDto` and the shared `ProviderSeller` interface (which has no such
field), I added a platform-keyed redirect route entirely inside the `affiliate` module. Same
security outcome, materially smaller blast radius.

*Out-of-scope finding, left untouched:* `apps/client/.../widgets/seller_row.dart` is dead code
— zero call sites.

Tests: 16.

### P0.2 Scheduler
**A real bug was found before any scheduler code was written.**
`GetComparisonByProductUseCase` — the notification-tap path, and the path a scheduler would
reuse — refreshed prices but emitted **neither** `PriceSnapshotRecorded` **nor**
`ProductPriceObserved`. Only the token-based `GetComparisonUseCase` did. A scheduler built on
top of it exactly as planned would have run, spent SerpAPI credits, updated caches — and never
fired a single alert. Fixed by emitting the same two events the live flow does. This also
repairs the pre-existing notification-tap flow, not just the new scheduler.

**Scope confirmed conservative.** I re-read the wishlist domain model: there is no "price
watch" concept distinct from a plain save, so Priority 2 was correctly skipped rather than
invented. Refresh candidates are **active price alerts only** — a wishlist save is never a
trigger, per the explicit product-owner modification.

`PriceAlertRefresherService` (`@Cron(EVERY_HOUR)`) lives in `modules/alerts/` — no `jobs/`
module, per the same modification. In-memory overlap guard, per-product `try/catch` isolation,
and a cap on *actual* provider refreshes (default 20, tunable via `app_config.alert_refresh_batch_cap`);
products still inside the 24h compare window cost 0 API calls and don't consume the cap.

Verified by booting the full app — all modules resolve, no circular DI. Tests: 8.

### P0.3 OpenAPI
Refactored `bootstrap/swagger.ts` to expose one shared `buildOpenApiDocument()` used by both
the in-app `/docs` UI and the new `scripts/export-openapi.ts` — deliberately **no** second
Swagger configuration. The script boots the full Nest app without an HTTP listener and writes
YAML via `js-yaml` (already a transitive dependency of `@nestjs/swagger`, now explicit).
Enabled the `@nestjs/swagger` CLI plugin so DTO classes carry accurate `@ApiProperty` metadata
automatically.

Result: **37 real routes** replacing a 0-route stub. **See §6 — this is not complete.**

### P0.4 CI and dependencies
Ran `npm audit --audit-level=high` first, as required: **24 findings**. Then triaged rather
than force-fixing:

- `npm audit fix` (the "safe", non-major mode) **broke the application** — it advanced
  `@nestjs/core` to 11.2.3 while leaving `@nestjs/common` at 11.1.29, producing a runtime
  module-resolution crash. Caught by the test suite, fixed by syncing `@nestjs/common`.
  (A transient `npm install @nestjs/common@latest` briefly pulled v12 — a major jump — and was
  immediately corrected to the matching 11.2.3.)
- `js-yaml` → 5.4.2 (patched, non-major).
- `deepmerge-ts` pinned forward via a package.json `overrides` entry (transitive, Prisma-CLI-only);
  verified `prisma --version` and `prisma generate` still work.
- **24 → 12.** Every remaining finding needs a major migration and none is reachable in
  production: the `multer`/NestJS chain requires NestJS v11→v12 and **no route in this codebase
  uses multer** (verified by grep — no `FileInterceptor`/`UploadedFile` anywhere); the
  `vitest`/`esbuild`/`vite` chain requires vitest v2→v5 and is dev-tooling only.

Removed `|| true` from `security.yml` — it is now a real gate that will honestly show red
until those migrations happen. Added `web-ci.yml`. Added `flutter build web` to `client-ci.yml`
(verified locally). Fixed 3 pre-existing `apps/web` lint errors that the new CI surfaced.

### P0.5 Structured data
Deleted the unconditional `availability: "https://schema.org/InStock"` from the product
JSON-LD and switched `priceCurrency` from a hardcoded `"INR"` to the real per-seller currency.
The backend's `Price.availability` is always written as `UNKNOWN` at ingestion (SerpAPI carries
no stock signal), so the field was pure fabrication in markup that search and shopping surfaces
consume. Verified live in-browser on a real product, and now **regression-tested** (§4).

---

## 3. P1 — high

- **Image ingestion** (`ImageStorageService`): HTTPS-only; streamed with a hard 8MB cap that
  aborts mid-stream rather than trusting `Content-Length`; magic-byte verification for
  JPEG/PNG/WebP/GIF that overrides any claimed `Content-Type`; the real detected type used on
  upload instead of a hardcoded `image/jpeg`; and `redirect: 'manual'` with every hop
  DNS-resolved and rejected on private/loopback/link-local ranges. 6 tests.
- **Search pagination**: backend now returns a real `meta.hasMore` derived from the
  Zod-enforced `PAGINATION.MAX_PAGES` ceiling. Threaded through the whole Flutter chain. The
  type change surfaced that `catalog_listing_controller.dart` had the **same** bug — it shares
  the search pipeline — so both were fixed. 4 tests.
- **Web caching/SEO**: investigated rather than flag-flipped. The three hub *detail* pages read
  `searchParams`, which is itself a Next.js Dynamic API, so a `revalidate` export there would
  be a silent no-op — left dynamic with an explanatory comment instead of faking ISR. The two
  index pages (`/category`, `/brand`) got real ISR, which also required a narrowly-scoped
  `apiClient.getCached()` because the shared client hardcoded `cache: "no-store"` (also
  dynamic-forcing). Confirmed in the `next build` output: `○ … Revalidate 1h`.
- **Config/logging**: the one stray `process.env` (FCM service-account path) is now a typed,
  Zod-validated config getter. `SerpApiClient` no longer logs the raw caught error — that
  request URL carries `api_key` as a query parameter.
- **Flutter maintainability** (code organisation only, zero rendered change): `home_screen.dart`
  667 → 341 lines (extracted `CategoriesSection`, `DealsSection`, `MostSearchedSection`,
  `SectionHeader`); `category_listing_screen.dart` 477 → 257 lines (extracted
  `CategoryDetailContent`). One subtle behaviour deliberately preserved: the Categories header
  renders during loading/error while the other two sections render nothing — flattening that
  would have been a visible change. Verified live, including exercising the Sort and Filter
  sheets (the callback-heavy part of the extraction).
- **Design tokens**: `tokens.json`'s `accentDark` was stale — both apps had independently
  applied the same WCAG contrast fix and the "source of truth" never caught up; corrected.
  `success`/`danger` differ across *three* files, so I documented the divergence rather than
  picking a winner and silently changing a shipped app's colours. Added the `semantic` section
  (`brand.primary`, `surface.*`, `text.*`, `chart.series.*` marked as the deliberate
  non-warm exception). Hex sweep found no undocumented strays.

---

## 4. P2 — this phase

### Deals terminology (the largest truthfulness finding of the pass)
`/deals` ranks by `discountPct`, which comes from the seller's own advertised "N% off" string
or MRP-vs-price (`immersive.mapper.ts`). It is **never** compared against a typical or
historical price. The copy claimed the opposite — emphatically:

| File | Was | Now |
|---|---|---|
| `web/app/deals/page.tsx` (metadata) | "priced well below their **typical average** — not just marked down from an inflated price" | "The biggest discounts off list price right now, across the stores OmniSift tracks." |
| `web/app/deals/page.tsx` (subtitle) | "A discount only matters if the earlier price was real… priced well below their **typical price** — not just marked down." | "The biggest discounts off list price right now… Open a product to compare it across every store before you buy." |
| `web/app/page.tsx` (empty state) | same "typical average, not just marked down" claim | "No discounted products to show yet…" |
| `web/app/category/[slug]/page.tsx` | "Biggest price **drop**" | "Biggest discount" |
| `client/.../category_detail_content.dart` | "Biggest price **drop**" | "Biggest discount" |
| `client/.../deals_section.dart` | "We found N products with **price drops**" | "We found N more discounted products" |
| `client/.../deals_section.dart` | "**Price Drops** You Might Like" | "More Discounts You Might Like" |

The old wording described, almost word for word, the one thing the implementation does *not*
do. It also collided with a real feature: price **alerts** genuinely do compare against a
previously recorded price, so two different signals were sharing one label. Per-card copy
("21% off at Blinkit") was already accurate and is unchanged. Each site of the change carries a
comment explaining what the data actually is.

**Flagged, deliberately not changed** (copy judgement calls with no factual misstatement —
your call, not mine):
- The **"Good Deal"** badge (product detail/compare) fires at `≥3%` spread between the
  cheapest and priciest seller *right now*. It's a cross-store spread indicator, not a
  market-value judgement — thin, but it sits directly above "You save ₹X (N%) vs highest",
  which defines it precisely.
- The **"Good price"** badge on every deal card is applied unconditionally to a set already
  selected for highest discount.
- **"Trusted Stores · 100% Safe"** in the Flutter value-prop strip. "Trusted Stores" is backed
  by a real store allowlist; "100% Safe" is an absolute marketing claim.

### Documentation reconciliation
`OMNISIFT_STATUS.md` was the worst offender and was rewritten against verified reality:
- claimed **"Dark Mode: full brown-based dark theme, app-wide"** — there is no dark theme at
  all; `app_colors.dart` documents light-only as a deliberate decision.
- listed Price History, Price Alerts + alert-check job, and Notifications as **"NOT yet built"**
  — all three exist (price-graph is built and flag-gated, not missing).
- described Home as having "Men/Women/Kids" sections that don't exist.
- never mentioned `apps/web`, deals, catalog hubs, guest access, or the scheduler.

Also: root `README.md` documented `API_BASE_URL=http://10.0.2.2:3000` — **missing the
`/api/v1` suffix**, so the documented command points the app at the wrong base URL (this cost
me real time during P1 verification); fixed, with the emulator-vs-browser distinction spelled
out. Replaced the stale "next step: Auth vertical slice" build sequence. `START_HERE_APP.md`
still promised a "You're signed in 🎉" placeholder Home. `packages/api-contracts/README.md`
claimed a generation flow that doesn't exist. Backend README gained the new export command.

`ARCHITECTURE.md` reconciled: it claimed `price-snapshots`, `cache-cleanup` and `alert-checks`
"run on a schedule" — `src/jobs/` is **three empty `.gitkeep` directories with zero code**.
Only alert refresh is scheduled (and lives in `modules/alerts/`); snapshots are reactive;
cache-cleanup doesn't exist. Decision 011 (`jobs/` top-level) is now marked as amended by the
product owner. The empty scaffold directories were left in place — deleting them is a
structural change, and the approved plan's REMOVE list was deliberately empty.

### Agent instructions
New root **`AGENTS.md`** (with `CLAUDE.md` importing it) covering: product identity and the
"one rule" data flow · frozen architecture and the explicit not-in-stack list · the guest
access tree · the 7-day/24-hour freshness policy and the alerts-only refresh rule · the
affiliate-redirect security rule including the pre-catalog carve-out · data-honesty rules
(no fabricated availability, discount ≠ price drop, deterministic-only AI) · image rules with
the Deals `unoptimized` exception · UI/design freeze with the chart-colour exception and
light-theme-only · database safety · testing integrity · security posture (no `process.env`
outside config, no credential-bearing error logs, audit gate must not be suppressed) · and
"when uncertain, preserve behaviour and report the ambiguity".

### Test strengthening
- **`RuntimeConfigService`** (8 tests) — the Supabase-backed dial switchboard had zero
  coverage despite its stated contract that config "tunes behaviour, never breaks the app".
  Pins: real values, whitespace/newline trimming, fallback on missing/unparseable rows,
  **no throw when the database is unreachable**, `0` honoured for cache windows but rejected
  for the alert batch cap, and the 5-minute snapshot cache.
- **`productJsonLd`** (6 tests) — the structured-data guard the P0 plan called for and I had
  to defer because `apps/web` had no test runner. Extracted the pure function to
  `src/lib/product-jsonld.ts` (Next validates page-file exports, so a page can't export a
  helper), added vitest, and wired `npm test` into `web-ci.yml`. **I verified the guard
  actually works** by temporarily re-adding `availability: InStock` and confirming the suite
  fails, then reverting.

> ✅ **Approved by the product owner.** Adding vitest to `apps/web` introduced a test runner to
> an app that had none (a devDependency plus one config file). Raised for veto because it is
> new tooling; kept, so `apps/web` now has a permanent home for unit tests and `web-ci.yml`
> runs them on every push/PR touching that app.

---

## 5. Verification

| | Backend | Web | Flutter |
|---|---|---|---|
| Types/analyze | `nest build` clean | `tsc --noEmit` clean | `flutter analyze` 0 errors |
| Lint | — | `eslint` clean | — |
| Tests | **42 passing** (11 files) | **6 passing** | 1 passing |
| Build | `nest build` | `next build` clean (ISR confirmed in route table) | `flutter build web` ✓ |
| Runtime | Full app boot, all modules resolve, no circular DI | Live in-browser | Live via `flutter run -d web-server` |

Live checks performed: product JSON-LD inspected in the DOM (no `availability`, real
currency); search suggestions after the `search-bar.tsx` lint fix; `/category` and `/brand`
ISR pages; the refactored Flutter Home sections and Category Listing including Sort and Filter
sheets; the corrected `/deals` copy; `/api/v1/deals` → 200 and `/docs` → 200.

**Non-blocking incident (recorded at your instruction):** during P1 verification a backgrounded
wait-loop watching the Flutter web-server boot log exited non-zero (exit code 4) after the
harness moved it to the background. This was a tooling/timing artifact, not a Flutter or
application failure — the server did boot and serve, and the full Flutter verification
afterwards passed (analyze, test, build web, plus live in-browser interaction).
**Classified non-blocking.**

---

## 6. Open items — explicitly NOT complete

### 6.1 OpenAPI request/response schemas — ✅ CLOSED (follow-on task)

**Resolved after this report was written** — see `OPENAPI_CONTRACT_REPORT.md`. All 44
operations now carry real schemas: 12/12 request bodies derived from the live Zod validators,
42/44 2xx response bodies against real component schemas (the other 2 are 302 redirects with
no body, correctly documented as such), 41 reusable components, 56 parameters, 154 error
responses, and a CI-enforced validator that fails on staleness, missing/fabricated routes,
broken refs or non-deterministic generation.

Two pre-existing inconsistencies were surfaced by that work and **reported rather than
changed** (both need product decisions): `GET /config` does not use the response envelope and
web's `apiClient.get()` therefore reads `undefined` from it; and malformed ids on the
affiliate redirects return 500 instead of 404 (no `Location` header is emitted either way, so
the no-open-redirect property is unaffected).

Client-code generation from the spec remains deliberately out of scope — both consumers still
hand-write their models.

The original description of the gap, kept for the record:

### 6.1a (historical) OpenAPI request/response schemas — was TOP PRIORITY
The spec is an accurate **route inventory** (37 routes, real params, tags, bearer-auth) but
**not a complete contract**. Most operations carry no body schema, because:
- responses are returned through a generic `ApiResponse<T>` envelope with no Swagger
  annotations and no explicit return types on controller methods; and
- request bodies are validated with **Zod**, not class-validator DTOs, so the `@nestjs/swagger`
  CLI plugin has no class to introspect.

Closing it means a per-route `@ApiOkResponse`/`@ApiBody` pass across all 18 controllers
(plus either explicit return types or a Zod→OpenAPI bridge). I did **not** attempt it in this
pass: ~40 annotations written under time pressure risks publishing *inaccurate* schemas, which
is worse than honestly absent ones, and it is orthogonal to the security work this brief
prioritised. Neither consumer generates code from the spec yet — `apps/web/src/lib/types.ts`
and the Flutter DTOs are hand-written.

**Per your standing instruction, this is not marked complete and must not be closed until real
request/response schemas exist.**

### 6.2 Remaining vulnerabilities (12)
`multer`/NestJS chain (needs NestJS v11→v12) and `vitest`/`esbuild`/`vite` chain (needs
vitest v2→v5). Neither is production-reachable today. `security.yml` will report them honestly.

### 6.3 No e2e/integration test infrastructure
`apps/backend/test/e2e` and `test/integration` are empty placeholders, and `npm run test:e2e`
points at a `vitest.e2e.config.ts` that does not exist. Every test added here is a unit test.

### 6.4 Pre-catalog affiliate tracking is weaker by design
Accepted and documented, per your own modification: pre-catalog results use the raw provider
URL for client-side navigation only. Supporting it properly needs a server-side
acquisition/token flow.

### 6.5 Smaller items
- `apps/client/.../widgets/seller_row.dart` — dead code, zero call sites.
- `src/jobs/{alert-checks,cache-cleanup,price-snapshots}` — empty scaffolding.
- Deals/Trending/Search debug `console.log`s in the backend provider layer, marked
  "TEMPORARY" in their own comments, are still there (noise, not secrets).
- The three copy judgement calls in §4 awaiting your decision.
