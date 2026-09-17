# OmniSift — working agreements

Read this before changing anything in this repo. It is the product owner's standing
instruction set. It **overrides** assumptions from stale comments, older docs, or a previous
agent's plan. When this file and a code comment disagree, this file wins — and the comment
should be fixed in the same change.

---

## 1. What OmniSift is

A **price-comparison / product-intelligence platform**: search a product, see what every
tracked store charges for it, compare, watch the price, buy at the cheapest store.
Tagline: *Buy with Confidence.*

Three surfaces, one backend:

| Surface | Path | Role |
|---|---|---|
| Backend | `apps/backend` | NestJS modular monolith. The only thing that talks to SerpAPI or the database. |
| Public web | `apps/web` | Next.js. Public/SEO surface, guest-only by design (ADR-0003). |
| Client | `apps/client` | Flutter. Android + authenticated web app. |

**The one rule:** `Client → OmniSift API → business logic → provider → SerpAPI`.
The client never calls SerpAPI or Supabase's database directly.

---

## 2. Frozen architecture — do not rebuild

NestJS modular monolith · Prisma · Supabase Postgres · Supabase Auth · Zod validation at the
boundary · Pino logging · Nest EventEmitter for internal events · Riverpod + GoRouter on
Flutter · Next.js App Router on web.

**Explicitly NOT in the stack, and not to be introduced:**
Redis · BullMQ or any queue · Kafka/RabbitMQ · microservices · Kubernetes · a generic "jobs
framework" · any LLM-backed AI (see §6).

Scheduled work uses `@nestjs/schedule` and lives **inside the module that owns the domain**
(the hourly price-alert refresh is in `modules/alerts/`). Do not create a `jobs/` module.

Do not reorganise the module tree, swap frameworks, or "modernise" the architecture. Fix the
bug in front of you.

---

## 3. Guest access — intentional, never "fix" it away

```
Guest (no account)              Authenticated
 ├─ Home                         ├─ Wishlist
 ├─ Search                       ├─ Alerts
 ├─ Categories                   ├─ Notifications
 ├─ Brands                       └─ Account / personal data
 ├─ Products
 ├─ Compare
 ├─ Price history
 └─ Deals
```

Browsing without an account is a deliberate product decision, not a missing auth gate.
Never add a login wall to anything in the left column. `apps/web` is guest-only by design and
has no session at all — that's why it has no CSRF middleware (there is nothing to forge).

---

## 4. Freshness policy — fixed windows, no adaptive refresh

- **Search results: 7 days** (`app_config.search_cache_days`, default `CACHE_TTL.SEARCH_DAYS`).
- **Compare results: 24 hours** (`app_config.compare_cache_hours`, default `CACHE_TTL.COMPARE_HOURS`).
- **Search pagination ceiling: 4 pages** (`PAGINATION.MAX_PAGES`), Zod-enforced on the request.
  The client must read `meta.hasMore` from the response — never infer "more available" from
  whether a page happened to return rows.

Both windows are runtime-tunable dials in Supabase `app_config`, read through
`RuntimeConfigService`. Do not invent adaptive/heuristic refresh, per-product TTLs, or
"smart" cache invalidation. On provider failure, serve the last cached data with a stale
timestamp and a graceful message — never an error page.

Proactive refresh is **alerts-only**: the scheduler refreshes products that have an *active
price alert*, capped per run. A wishlist save is **not** consent to poll the marketplace —
never make wishlist membership a refresh trigger.

---

## 5. Affiliate redirect security — never trust a client-supplied destination

**For catalogued products:**
```
Client → productId + sellerId (or platform) → OmniSift redirect endpoint
       → backend resolves the stored ProductListing URL → 302
```
The destination is always re-derived server-side from a real `(product, seller)` row. The
endpoint takes **path params only** — never a URL.

**Rules:**
- No endpoint may accept an arbitrary client-supplied destination URL. No open redirect.
- `POST /affiliate/clicks` must never persist a client-asserted URL as a trusted destination.
  It resolves the real listing and **fails closed** (404) when no such listing exists.
- For pre-catalog search results (no persistent product/seller row yet), the raw provider URL
  may be used as a temporary external-navigation fallback **on the client only**. It must not
  be accepted by an OmniSift redirect endpoint and must not be stored as a trusted destination.
- Supporting pre-catalog affiliate tracking properly needs a server-side acquisition/token
  flow. Build that deliberately; don't reach for an open redirect.

---

## 6. Data honesty — do not fabricate

This is a price-comparison product. Users make purchase decisions on what it shows. Every
displayed number and claim must trace back to real data.

- **Never fabricate a signal that doesn't exist.** `Price.availability` is always `UNKNOWN`
  at ingestion (SerpAPI has no real stock status), so product JSON-LD **omits**
  `availability` rather than asserting `InStock`. Same principle everywhere.
- **"Deal"/"discount" ≠ "price drop".** `/deals` ranks by the seller's *advertised discount
  off list price* (or MRP-vs-price). It is **not** validated against a typical or historical
  price. Copy must say "discount". Price **alerts** are the real observed-drop feature
  (they compare against a price OmniSift recorded earlier) — keep the two worded distinctly.
- **Sparse is fine; fake is not.** Sections with no real data hide themselves rather than
  showing placeholder content. Don't "fill them in".
- **AI strategy: deterministic only for V1.** "Omni's Take" is computed from real fields
  (`shared/domain/compute-product-omni.ts`) — no model calls, no LLM. An `AIProvider`
  abstraction is a future option, not something to wire up now.
- Don't invent "best value" / quality scores. There is no seller-quality or per-product
  popularity signal to back one yet.

---

## 7. Images

- Product images are re-hosted to Supabase Storage; `next.config.ts` `remotePatterns` is
  deliberately narrow (`*.supabase.co`, `*.gstatic.com`). Keep it narrow.
- **Deals exception:** a deal's image can fall back to a raw, never-rehosted per-listing
  thumbnail, so Deals cards render `unoptimized` on purpose. Don't "fix" that to match the
  other cards — it would break images whenever a new CDN shows up.
- `ImageStorageService` intake rules (do not weaken): HTTPS-only · streamed with a hard byte
  cap (never trust `Content-Length`) · magic-byte verified (never trust a claimed
  `Content-Type`) · every host including each redirect hop DNS-resolved and rejected if it
  lands on a private/loopback/link-local range.

---

## 8. UI and design

- **The UI initiative is complete and approved. Do not redesign it.** Don't change page
  hierarchy, typography, colours, spacing, wording, navigation behaviour, card design, or
  user flows — unless required to fix a confirmed bug or security issue, and then say so
  explicitly rather than folding it in silently.
- **Brand palette is frozen:** warm cream/ivory + dark chocolate brown + gold. Refine it;
  never replace it with a blue/purple SaaS theme, gradients-as-branding, or glassmorphism.
- **Chart-colour exception:** price-history chart series (`price_graph_screen.dart`
  `_seriesColors`) are deliberately **non-warm**, because series must be distinguishable from
  each other and from the brand palette. This is a documented exception, not a violation —
  don't "fix" it to brand colours.
- **Light theme only.** There is no dark theme; that was a deliberate decision, not a gap.
- Colour/spacing/type tokens live in `packages/design-system/tokens.json`, mirrored by hand
  into `apps/web/src/app/globals.css` and `apps/client/lib/core/theme/`. There is no build
  pipeline — if you change a value, update every mirror in the same change.

---

## 9. Database safety

- **Do not modify the Prisma schema or create a migration** unless the work genuinely proves
  a schema change is required.
- If one is unavoidable: explain why *first*, preserve existing data, make it
  backward-compatible where practical, **never** reset or drop the database, and never use a
  destructive shortcut.
- This points at a live Supabase project with real data.

---

## 10. Testing integrity

- Never modify a test to make a failure disappear.
- Never replace real behaviour with a mock purely to make a test pass.
- Never weaken an assertion.
- When a test exposes a real bug, **fix the implementation**.
- Convention: *fakes over mocks* — test inputs and outputs, not internals.
- **Vitest everywhere on the TypeScript side** (not Jest):
  - `apps/backend` — `test/unit/**/*.spec.ts`, run with `npm test`.
  - `apps/web` — `src/**/*.test.ts`, run with `npm test`. Pure helpers only (no jsdom, no
    React rendering); pages are server components covered by `next build` and in-browser
    checks. If a page needs a testable helper, extract it to `src/lib/` — Next validates
    page-file exports, so a page cannot export one.
  - Both run in CI (`backend-ci.yml`, `web-ci.yml`).
- Flutter has `flutter test` but almost no coverage today; `flutter analyze` must stay at
  0 errors.

---

## 11. Security posture

- All backend config goes through `AppConfigService` (Zod-validated at boot). Never read
  `process.env` directly outside `core/config/`.
- Never log a raw error object from an outbound HTTP call whose URL carries credentials —
  SerpAPI takes `api_key` as a query parameter. Log a sanitised status/reason instead.
- Swagger (`/docs`) is mounted in non-prod only; it publishes the whole schema and has no
  access control of its own.
- `npm audit` in CI is a **real gate**. If it fails: investigate the dependency chain and
  patch it. Do **not** suppress the failure, re-add `|| true`, or lower the audit level to go
  green. Anything that genuinely can't be fixed gets reported explicitly as a known issue.

---

## 12. When you are uncertain

**Preserve existing behaviour and report the ambiguity. Do not invent a product decision.**

If a change would require deciding something the product owner hasn't decided — new copy that
makes a claim, a new data signal, a threshold, a policy — stop and ask. Flagging an unresolved
question is a good outcome. Quietly guessing is not.

Report honestly: what changed, why, which files, what you ran, what passed, and what is still
open. A known, documented limitation is acceptable. A hidden one is not.
