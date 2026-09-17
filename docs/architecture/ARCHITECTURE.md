# Omnisift — Platform Architecture (V1)

> **Status: 🔒 FROZEN** · Version 1.3 · Owners: Ganesh (Frontend), Mohan (Backend)
> **Promise:** *Buy with Confidence.*
> v1.3 supersedes v1.2 — §9/§7 updated for the Android+Web security hardening pass (CORS fail-fast, Swagger production gating, RLS FORCE fix, apps/web CSP/headers). No new ADR: this extends the existing §9 security mandate rather than reopening a frozen decision.

---

## 0. How to use this document

The **single source of truth** for how Omnisift is built. Consolidates the Product Overview, PRD, and Engineering Handbook Vols I–VI plus every decision locked during design.

- Read this **before writing any production code**.
- If an older doc conflicts with this one, **this document wins**.
- To change anything marked 🔒, open an ADR (§15) and get sign-off from both engineering owners. Don't silently deviate.

---

## 1. North Star & the one hard rule

Everything serves one promise: **Buy with Confidence.** If a feature doesn't increase buying confidence, it isn't in V1.

Omnisift is **not** a shopping app. It's a **Product Intelligence Platform** — an intelligence layer *above* Amazon/Flipkart/etc., never a competitor to them.

### 🔒 The Boundary Rule

```
Flutter  ──►  Omnisift API  ──►  Business Logic  ──►  Provider Layer  ──►  SerpAPI
```

- Flutter **never** calls SerpAPI.
- Flutter **never** touches the Supabase database directly for application data.
- The backend is the only authority. The database is the source of truth — never Google Shopping.

Every other rule is downstream of this.

---

## 2. Technology stack — 🔒

| Concern | Choice |
|---|---|
| Client — mobile + authenticated web | **Flutter** — Android + Flutter Web; wishlist, alerts, account, compare, Omni chat (ADR-0003) |
| Client — public/SEO web | **Next.js** (or equivalent SSR/SSG) — `apps/web`; home, category, brand, product, guides, deals (ADR-0003) |
| State + DI | **Riverpod 3** (only — no Provider/Bloc/GetX; no service locator) |
| Navigation | **GoRouter** |
| Networking | **Dio** — single `ApiClient` |
| Models | **Freezed** + json_serializable (immutable) |
| Secure storage | **flutter_secure_storage** (tokens — never SharedPreferences) |
| Local cache / offline | **Hive** + cached_network_image |
| Client telemetry | **Firebase** — Crashlytics · Analytics · Performance |
| Backend framework | **NestJS 11** (TypeScript) |
| ORM | **Prisma 6** |
| Database | **PostgreSQL** (Supabase, Mumbai) |
| Auth | **Supabase Auth** + JWT (server-side, behind our API) |
| Validation | **Zod** (at the boundary) |
| Logging | **Pino** (structured, correlation id per request) |
| API docs / contract | **OpenAPI / Swagger** |
| Testing | Vitest + Supertest (backend) · flutter_test + integration_test (client) |
| Product data provider | **SerpAPI** → Google Shopping (behind `ProductProvider`) |
| Cache store (V1) | **PostgreSQL only** — no Redis |
| Jobs (V1) | **Scheduler only** — no queue (BullMQ/Redis later) |
| Repo model | **Monorepo** |

**Explicitly not in the V1 stack:** Redis · Kafka/RabbitMQ/BullMQ · microservices · Kubernetes · any LLM-backed AI. The architecture can evolve toward them; we don't build them now. Deterministic scoring/explanations (no model calls) are in scope — see ADR-0002.

---

## 3. Repository layout — 🔒 (the final frozen tree)

```
OMNISIFT/
├── apps/
│   ├── client/                    # Flutter — Android + authenticated Web (ADR-0003)
│   │   └── lib/
│   │       ├── app/               app.dart · router.dart · providers.dart · bootstrap.dart
│   │       ├── core/              config · constants · errors · network · security
│   │       │                      storage · services · theme · utils · extensions
│   │       ├── shared/            widgets · components · dialogs · loaders · validators
│   │       └── features/          (4-layer per feature — see §5)
│   │           auth · home · search · products · compare · wishlist · alerts · profile · settings
│   │
│   ├── web/                       # 🆕 Next.js (or equivalent SSR/SSG) — public/SEO surface (ADR-0003)
│   │                              home · category · brand · brand×category · product · deals · trending · guides
│   │                              calls the same backend via packages/api-contracts/openapi.yaml; no direct Supabase access
│   │
│   ├── backend/                   # NestJS
│   │   ├── src/
│   │   │   ├── bootstrap/         app · swagger · validation · logger
│   │   │   ├── core/              config · database · logger · errors · security · events · middleware
│   │   │   ├── shared/            constants · types · interfaces · dto · utils
│   │   │   ├── modules/           (business features, 4-layer each — see §5)
│   │   │   │   auth · users · search · products · compare · price-intelligence
│   │   │   │   wishlist · alerts · notifications · affiliate · analytics
│   │   │   ├── integrations/      providers/serpapi · firebase · affiliate-networks · (future: ai/ — ADR-0002)
│   │   │   └── jobs/              price-snapshots · cache-cleanup · alert-checks
│   │   └── prisma/                schema.prisma · migrations/ · seed.ts
│   │
│   └── admin/                     # 🕓 FUTURE — not built in V1
│
├── packages/
│   ├── shared/                    minimal cross-app code
│   ├── api-contracts/             openapi.yaml  (the contract — NOT shared TS code)
│   └── design-system/             design tokens (color · spacing · type scale) shared by client + web (ADR-0003); components stay per-framework
│
├── docs/                          engineering-handbook · product · architecture · api · adr
├── scripts/                       database · maintenance · migration
├── .github/workflows/            client-ci · web-ci · backend-ci · security  (admin-ci later)
├── .gitignore · README.md · LICENSE
```

### 🔒 Four structural rules that keep this tree honest

1. **`integrations/` sits at `src/` level, not inside `modules/`.** SerpAPI, Firebase, affiliate networks are *infrastructure*, not features. **Modules own business decisions; integrations implement interfaces.** (Search module → `ProductProvider` interface → SerpAPI integration — never Search → SerpAPI directly.)
2. **Only create a feature folder when that feature is actually being built.** No pre-made empty architecture for `price_history`, `rewards`, `shopping-intelligence`, etc. Boundaries, not empty rooms. (Product Omni's explanation/scoring logic lives inside `price-intelligence`/`products` until the Shopping Adviser is real enough to justify its own module — ADR-0002.)
3. **`admin/` stays a future marker.** Not built in V1; extract only when a real consumer exists. **`design-system/` is no longer a pure future marker** — its design tokens are extracted as soon as `apps/web` exists, since Flutter and the new web app must render the same brand; framework-specific components still live in each app (ADR-0003).
4. **`apps/web` is public-surface only.** It never talks to Supabase directly and never receives the service-role key — same rule as `apps/client`. Authenticated features (wishlist, alerts, account, compare, Omni chat) stay on `apps/client`; `apps/web` links out to sign-in for those (ADR-0003).

---

## 4. Module responsibilities — 🔒

| Module | Owns |
|---|---|
| `auth` | Login · registration · logout · session · password reset · authentication |
| `users` | User profile · preferences · account settings · metadata · account deletion |
| `search` | Product discovery · query normalization · cached search |
| `products` | Canonical product · variants · listings · acquisition · identity · knowledge |
| `compare` | Multi-seller comparison · compare cache |
| `price-intelligence` | Snapshots · history · statistics · lowest/highest · price-change events · drop detection · Product Omni's deterministic explanation/scoring (rules over price + spec data, no model calls — ADR-0002) |
| `wishlist` | Saved products |
| `alerts` | Price-alert rules |
| `notifications` | In-app / push notification records |
| `affiliate` | Outbound tracking links · click logging |
| `analytics` | Event capture (some events fire pre-auth) |

`auth` vs `users` is a deliberate split — `auth` handles *getting in*, `users` handles *who you are*. `price-intelligence` is a first-class engine, not a corner of `products`, because price history is the moat.

`products` stays **plural** so the three distinct concepts never blur:
```
Product ── Variant ── Listings (Amazon · Flipkart · Myntra · AJIO · Meesho)
```

---

## 5. Clean Architecture — 🔒

Both client and backend use the same four layers. **They mirror each other**, so a backend dev moving to frontend already knows the shape.

```
Presentation  ──►  Application  ──►  Domain  ◄──  Infrastructure
```

### The Dependency Rule (non-negotiable)

Dependencies point **inward**. Domain depends on **nothing** (no NestJS, Prisma, SerpAPI, Dio, or Flutter imports).

| Layer | Owns | Must NOT contain |
|---|---|---|
| **Presentation** | controllers/routes (backend) · screens/widgets/providers (client) · input handling · navigation | business logic · HTTP · SQL · provider calls |
| **Application** | use cases (one use case = one action) · DTOs · mappers | framework details · direct DB/provider access |
| **Domain** | entities · value objects · repository *interfaces* · domain services | any framework/ORM/HTTP/UI import |
| **Infrastructure** | repository *implementations* · datasources · provider clients · ORM models · mappers | business rules |

### Uniform depth — 🔒

Every feature uses the full 4 layers (uniform, not tiered). To keep that cheap, it's **mechanical**: use `nest g` generators + one frozen module template (backend) and one cloned feature template (client). If a simple CRUD feature's domain/dto come out thin, that's fine — consistency is the value we chose. Don't invent logic to fill layers.

### Feature template (both sides)

```
Backend module/                          Client feature/
  presentation/ (controllers·validators)   presentation/ (screens·widgets·providers)
  application/  (usecases·dto·mappers)      application/  (usecases·dto)
  domain/       (entities·repositories·services)  domain/ (entities·repositories)
  infrastructure/ (repositories·datasources·mappers)  infrastructure/ (datasources·models·mappers·repositories)
```

---

## 6. Cross-cutting components — 🔒

- **Provider abstraction** — every provider implements `ProductProvider { search · getProduct · getComparison }`. SerpAPI today; Amazon/Flipkart later = a new implementation, zero changes elsewhere. **Our most important structural bet.**
- **`AIProvider` abstraction (future)** — same pattern, for whichever LLM ends up behind the Shopping Adviser. No model hard-coded; activates only when that module is actually built, gated by per-user quotas (ADR-0002).
- **Product Acquisition Service** (`modules/products/application/`) — acquiring data is a business capability: `provider → validate → normalize → resolve identity → persist → return canonical`. Repositories only store/retrieve.
- **Product Identity (V1, no AI)** — `provider + provider_product_id → listing → canonical product`. Cross-provider matching is conservative; flag uncertain matches, never force-merge.
- **Internal event bus** (Nest EventEmitter, no queue) — emitters don't know their listeners. The real events (`core/events/app-events.ts`): `price.observed` → price-history append; `product.price.observed` → price-alert checker; `price.snapshot.recorded` → daily snapshot dedup; plus `product.updated` / `alert.triggered`.
- **Jobs (scheduler only)** — ⚠️ *reconciled against the implementation:* exactly **one** scheduled job exists — the hourly price-alert refresh (`@nestjs/schedule`), which lives in `modules/alerts/` rather than `jobs/` (see decision 011 below). `price-snapshots` is **not** scheduled — snapshots are recorded reactively off `price.snapshot.recorded` when a comparison is fetched — and `cache-cleanup` does not exist at all; cache entries expire by timestamp rather than being swept. The `src/jobs/*` directories are empty scaffolding. Introduce Redis/BullMQ only when traffic justifies it.
- **Caching (Postgres)** — search results **7 days**, compare results **24 hours**. On provider failure: return last cached data with a stale timestamp + a graceful message, never an error page.

---

## 7. Database principles — 🔒 (full schema is deliverable #2)

- **Postgres (Supabase) is the source of truth.**
- **Price history is append-only** — never overwrite a price; insert a new record.
- The canonical catalog is the primary asset; provider listings attach to it, they don't define it.
- **RLS on every table, default-deny, both ENABLE and FORCE.** Backend is the only DB client (service_role bypasses RLS regardless); Flutter never connects directly. RLS lives in `prisma/sql/enable_rls.sql`, not `schema.prisma` — re-run it after adding a table, and note it only sets ENABLE; FORCE needs a second pass (a live check on 2026-09-06 found every table had ENABLE but not FORCE — apply both).

Tables (finalized in the schema deliverable): `users · brands · categories · products · product_variants · providers · sellers · product_listings · prices · price_history · search_cache · compare_cache · wishlist_items · price_alerts · affiliate_clicks · analytics_events · notifications`.

---

## 8. The API contract — 🔒

- **Source of truth = `packages/api-contracts/openapi.yaml`.** The backend generates it from Swagger; the client generates its API models from it.
- **No shared TypeScript model package** — backend is TS, client is Dart; they can't share code. The contract is the OpenAPI document, not code. This stops either side from becoming the accidental source of truth for the other.

---

## 9. Backend standards (NestJS) — 🔒

- **Thin controllers** → use cases → repositories. No business logic, DB, or provider calls in controllers.
- **Validation at the boundary** with Zod. Never trust client input.
- **Error taxonomy** — every error is one of `ValidationError · AuthenticationError · AuthorizationError · NotFoundError · ProviderError · DatabaseError · BusinessRuleError`, each with code · user message · internal log · HTTP status. A global filter renders safe JSON. **Never expose stack traces.**
- **Structured logging (Pino)** — correlation id per request (`x-request-id`).
- **Security (mandatory):** JWT verification (Supabase) · Helmet · rate limiting (throttler) · input validation · Prisma (SQL-injection safe) · CORS · secrets only in env.
  - **CORS_ORIGINS fails the boot, not just logs a warning**, if left at its `*` default in production (`bootstrap/app.ts`) — the realistic failure mode is forgetting to set it before deploying, not someone deliberately choosing an open policy.
  - **Swagger (`/docs`) never mounts in production** (`bootstrap/swagger.ts`) — it publishes the full API schema with no access control of its own; fine for dev/staging, a real exposure once something is actually deployed.
  - **Affiliate links never expose a raw seller URL.** Public redirects resolve server-side: `GET /affiliate/go/product/:id/seller/:id` (no auth, used by apps/web) looks up the real URL and 302s — never a `?url=` passthrough that could turn the API into an open redirector.
- **Config** via a Zod-validated env module — never read `process.env` directly, never hardcode a key.
- Every public endpoint documented in OpenAPI.
- **Web security (apps/web)** — a public, unauthenticated, no-cookie surface, so its hardening looks different from the backend's: CSP (`script-src`/`style-src 'unsafe-inline'` — no HTML-injection surface exists, since nothing renders via `dangerouslySetInnerHTML`, so this is defense-in-depth on top of JSX's own escaping, not the only line; revisit with a nonce if that ever changes), `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and no `X-Powered-By` — all set in `next.config.ts`. No CSRF middleware: bearer tokens live only in the Flutter app, this app has no session to forge.

---

## 10. Client standards (Flutter) — 🔒

- **No business logic in widgets.** No HTTP/SQL/SerpAPI/JSON-parsing in the UI. UI → UseCase → Repository → Datasource → Dio.
- **DTO mapping** — never expose raw API models to UI: `DTO → Mapper → Entity → UI`.
- **Riverpod does DI** (no GetIt). **Single Dio `ApiClient`** with auth · logging · retry interceptors.
- **Every screen: Loading · Success · Empty · Error.** Skeletons, not full-screen spinners.
- **Design tokens only** — colors/spacing/radius/typography/motion from the central system. No raw hex or magic sizes. **Build the design system before screens.**
- **i18n scaffold from day one; ship English-only in V1.**
- **Navigation:** 5 bottom tabs — Home · Search · Wishlist · Alerts · Profile.
- **Responsive:** mobile and desktop share logic + tokens but **reorganize** layout — don't stretch mobile onto desktop.

### Coding limits (both sides)

One public class per file · screens < ~300 lines · widgets < ~150 · functions < ~40 · no circular deps.

---

## 11. Naming — 🔒

Classes named for architectural role (`SearchController`, `ProductRepository`, `SerpApiProvider`). `UpperCamelCase` types · `lowerCamelCase` members · `snake_case` files/folders · `UPPER_SNAKE` constants. Modules `kebab-case` (`price-intelligence`).

---

## 12. Operations — 🔒

- **Git:** `main` (prod) ← `release/*` ← `develop` ← `feature/*`; `hotfix/*` for emergencies. No direct merges to main.
- **Commits:** Conventional Commits (`feat(search): add cache`).
- **CI on every push:** lint → format → test → build → preview. Nothing auto-deploys to prod.
- **Environments:** development · staging · production — separate DB, keys, config.
- **Secrets never committed** — env vars only.
- **Definition of Done:** code + tests pass + docs updated + reviewed + API documented + UI verified + no console errors + no TODOs.
- **Current internal ops tooling = Firebase console + Supabase dashboard.** No custom admin app in V1.

### Performance budgets (V1 targets)

Search < 800 ms cached / < 3 s fresh · app startup < 2 s · screen transition < 300 ms · crash-free > 99.5% · API availability > 99.9%.

---

## 13. Rebuild strategy — 🔒

**Sequenced vertical slices.** The old prototype keeps running until the new app passes the full MVP journey. Never a state where nothing runs. Each slice is built end-to-end (backend + client, all 4 layers), tested, then the next begins.

---

## 14. Explicitly NOT in V1 — 🔒

Conversational/LLM-based Shopping Adviser · AI/ML product matching · adaptive cache refresh · multiple provider APIs · Redis · queues · microservices · Kubernetes · custom admin app · browser extension · iOS · merchant dashboard · voice/image search · guest mode · multi-language (English only; i18n scaffold only). **Deterministic Product Omni** (rules/scoring over existing data, no model calls) **is in V1** — see ADR-0002.

---

## 15. Decision log (ADR summary)

| ADR | Decision | Why |
|---|---|---|
| 001 | **NestJS** backend | Committed to Clean Architecture + modules + DI + Prisma + Zod + OpenAPI; NestJS gives it natively. |
| 002 | **Uniform 4-layer** all features | Consistency across a team; generators + template make it cheap. |
| 003 | **Sequenced vertical slices** | Small pre-launch codebase; rebuild safely, always runnable. |
| 004 | **Provider abstraction** | Providers are replaceable (SerpAPI → Amazon/Flipkart). |
| 005 | **Postgres-only cache** | No traffic yet to justify Redis. |
| 006 | **Monorepo, minimal packages** | Boundaries now; extract packages only on real need. |
| 007 | **Riverpod for DI** | Compile-time safety, easier testing, no service locator. |
| 008 | **i18n scaffold, English ship** | Reconciles Handbook Vol IV vs PRD non-goal. |
| 009 | **`apps/mobile` → `apps/client`** | One Flutter app serves Android + Web. |
| 010 | **`integrations/` at src level** | Integrations are infra, not features; they implement interfaces. |
| 011 | ~~**`jobs/` top-level, scheduler-only**~~ → **scheduled work lives in its owning module** | **Amended by the product owner during the production-hardening pass.** A dedicated `jobs/` module is only justified if it actually reduces coupling; it didn't. The one scheduled job (hourly price-alert refresh) sits in `modules/alerts/` beside the alert repository and checker it drives. No generic "jobs framework". The empty `src/jobs/*` scaffold directories are unused — kept only to avoid an unrelated structural change. |
| 012 | **`auth` split from `users`** | Distinct responsibilities: getting in vs who you are. |
| 013 | **`price-intelligence` first-class module** | Price history is the moat; it deserves its own engine. |
| 014 | **`products` plural + variants/listings** | Keeps Product / Variant / Listing distinct — critical for matching. |
| 015 | **`api-contracts` = OpenAPI, not TS** | TS and Dart can't share a code package; the contract is the spec. |
| 016 | **`admin` + `design-system` deferred** | No consumer yet; Firebase + Supabase cover ops for now. |
| 017 | **Feature folders only when building** | Avoid beautiful empty architecture nobody uses. |
| 018 | **Product Omni in V1 (deterministic), Shopping Adviser deferred** | Explanation/scoring needs no model; the conversational adviser does — decide them separately instead of one blanket "AI" call. ([ADR-0002](../adr/ADR-0002-omni-ai-shopping-intelligence.md)) |
| 019 | **`apps/web` added; Flutter Web narrowed to the authenticated app** | Flutter Web can't deliver real SSR/SEO; a Next.js-class app owns the public/SEO surface, Flutter keeps the logged-in app. Narrows ADR 009, doesn't reverse it. ([ADR-0003](../adr/ADR-0003-web-platform-split.md)) |

Reopening a 🔒 decision requires a new ADR in `docs/adr/` + sign-off from both engineering owners.

---

## 16. Build sequence (each = one deliverable, one green-light)

1. ✅ **`ARCHITECTURE.md`** — this document (frozen).
2. ✅ **Database schema** — `schema.prisma` + rationale (17 tables).
3. ✅ **Repo scaffold + foundation** — final frozen tree; Nest bootstrap/config/logger/error/security/Prisma; Flutter bootstrap/Dio ApiClient/Riverpod/design tokens. No feature logic.
4. **Auth slice** — backend done; client (app screens) next. Becomes the template every feature copies.
5. **Remaining slices**, one at a time: `search → products (acquisition + identity) → compare → price-intelligence → wishlist → alerts → notifications → analytics → profile/settings`. Old prototype stays runnable until the new app passes the full MVP journey.

---

## 17. Team

| Person | Role | Owns |
|---|---|---|
| **Ganesh** | Frontend Lead | Flutter architecture · UI · design system · client performance |
| **Mohan** | Backend Lead | Backend architecture · API · product acquisition · DB · providers · security |
| **Hemanth** | Marketing Lead | Acquisition · affiliate partnerships · branding · growth |
| **Srinadh** | Growth & Ops | Content · SEO · analytics · feedback · research |

---

*Every new feature must answer three questions (Handbook Vol II): Which engine owns this? Which layer implements it? Does it strengthen "Buy with Confidence"? If you can't answer all three clearly, the design needs more work.*
