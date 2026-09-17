# OmniSift — Build Status

Monorepo: NestJS backend (`apps/backend`), Next.js public web (`apps/web`), Flutter client
(`apps/client`). Heavy regenerable folders (`node_modules`, `build`, `.dart_tool`, `.gradle`)
are not committed — reinstall locally.

> Last reconciled against the actual code during the production-hardening pass
> (see `OMNISIFT_PRODUCTION_HARDENING_REPORT.md`). Everything below was verified
> against the implementation, not carried over from an earlier status doc.

## Getting it running

### Backend (apps/backend)
```bash
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev        # apply pending migrations
npm run start:dev             # needs .env: DATABASE_URL, DIRECT_URL, SUPABASE_*, SERPAPI_KEY
```
- API base: `http://localhost:3000/api/v1`
- Swagger (non-prod only): `http://localhost:3000/docs`
- Export the OpenAPI contract: `npm run export:openapi` → `packages/api-contracts/openapi.yaml`

### Web (apps/web)
```bash
cd apps/web
npm install
npm run dev                   # defaults to API_BASE_URL=http://localhost:3000/api/v1
```

### Client (apps/client)
```bash
cd apps/client
flutter pub get
dart run build_runner build -d
# Android emulator (the app's own compiled-in default):
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 ...
# Browser / desktop — 10.0.2.2 is an Android-emulator-only alias and will time out:
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api/v1 \
  --dart-define=SUPABASE_URL=https://YOURPROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<your anon key>
```

## What's built and working

**Backend (18 controllers, 37 routes — see `packages/api-contracts/openapi.yaml`)**
- Auth (email/password + Google, refresh, logout, forgot-password), Users
- Search (SerpAPI-backed, row-cached, budget-capped) + free Google autocomplete suggestions
- Compare (token-based and by-productId), product acquisition into the catalog
- Catalog: categories, brands, category/brand detail with real facets, similar products,
  variant siblings
- Deals, Discovery (trending / most-searched), Price history + price-graph
- Wishlist, Price alerts, Notifications (+ FCM push, device tokens)
- Affiliate click tracking and the server-resolved affiliate redirect
- Scheduled price-alert refresh (`@nestjs/schedule`, hourly, batch-capped, alerts-only)

**Web (`apps/web`, public/SEO surface, guest-only by design — ADR-0003)**
Home, Search, Category + Brand hubs, Product detail (with JSON-LD), Deals, Trending,
Guides, plus robots/sitemap/OG image. Category and Brand index pages are ISR-cached (1h);
everything price-facing stays dynamic.

**Client (`apps/client`, 24 screens)**
Splash/Welcome/Login/Register/Forgot-password · Home · Search · Category listing ·
All categories · All brands · Brand page · Product detail · Product compare · Price graph ·
Recently viewed · Wishlist · Alerts + Create alert · Notifications · Profile ·
Account details · Settings · Help & support · Affiliate click history.

## Deliberate decisions that are NOT gaps
- **Light theme only.** There is no dark theme — this was a deliberate product decision
  (documented in `apps/client/lib/core/theme/app_colors.dart`), not unfinished work.
- **Price-graph is flag-gated.** The screen, controller and `/products/price-graph`
  endpoint all exist, but render only when the runtime flag `price_graph_enabled`
  (Supabase `app_config`) is on — off by default until enough cross-seller history exists.
  The feature is built; it is not "missing".
- **Guest browsing is intentional.** Home, Search, Categories, Brands, Products, Compare,
  Price history and Deals work signed-out. Wishlist, Alerts, Notifications and Account
  require auth. See the root `AGENTS.md`.
- **Deals = discount off list price.** `/deals` ranks by the seller's advertised discount
  (or MRP-vs-price), not against a typical/historical price. Copy must say "discount",
  never "price drop" — price *alerts* are the real observed-drop feature.
- **Chart series colours are deliberately non-warm** (data-viz differentiation), the one
  documented exception to the warm brand palette.

## Known open items
- **OpenAPI schemas are incomplete.** The spec now lists all 37 real routes with real
  params/tags/security, but most routes still carry no request/response *schema*: responses
  go through an un-annotated generic envelope and requests are Zod-validated rather than
  class-DTO validated, so `@nestjs/swagger` can't introspect them. Consumers (web, Flutter)
  still hand-write their models. Tracked as the top follow-up.
- **`npm audit` is red on 12 findings**, all requiring major-version migrations
  (NestJS v11→v12 for a transitive `multer`; vitest v2→v5 for `esbuild`/`vite`). Neither is
  reachable in production today — no route uses multer, and vitest/esbuild are dev-only.
  `security.yml` is now a real gate and will show this honestly.
- **No e2e/integration test infrastructure.** `test/e2e` and `test/integration` are empty
  placeholders and `npm run test:e2e` references a `vitest.e2e.config.ts` that doesn't exist.

## Known non-code issues
- `PROVIDER_ERROR` on search/comparison = SerpAPI quota exhausted or a transient outage,
  not a code bug. Free tier is ~100 calls/month and both search and comparison consume them.
