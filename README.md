# Omnisift — *Buy with Confidence.*

Product Intelligence Platform. Monorepo for the Flutter client and NestJS backend.

## Layout
```
omnisift/
  apps/
    client/     Flutter (Android + authenticated Web)
    web/        Next.js — public/SEO surface (ADR-0003)
    backend/    NestJS (TypeScript)
  packages/
    shared/     minimal cross-app code (extract only on real need)
    design-system/  brand design tokens, shared by client + web (ADR-0003)
  docs/         architecture, PRD, handbooks, ADRs
  .github/      CI workflows
```

## Prerequisites
- Node.js ≥ 20, npm ≥ 10
- Flutter ≥ 3.24 (Dart ≥ 3.5)
- A Supabase project (Postgres + Auth)

## Run the backend
```bash
cd apps/backend
cp .env.example .env      # fill in real values
npm install
npx prisma generate
npx prisma migrate dev    # creates tables
psql "$DIRECT_URL" -f prisma/sql/enable_rls.sql   # apply RLS (see backend README)
npm run start:dev
```
Swagger docs: http://localhost:3000/docs

## Run the web app
```bash
cd apps/web
npm install
npm run dev     # http://localhost:3001, defaults to the backend at localhost:3000/api/v1
```

## Run the client
```bash
cd apps/client
flutter pub get
dart run build_runner build -d      # freezed / json / riverpod codegen
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 \
            --dart-define=SUPABASE_URL=... \
            --dart-define=SUPABASE_ANON_KEY=...
```
The base URL must include the `/api/v1` suffix — the backend serves everything under the
`api` global prefix with URI versioning. `10.0.2.2` is the **Android emulator's** alias for
your host machine; on a browser/desktop target use `http://localhost:3000/api/v1`, and on a
USB-attached phone run `adb reverse tcp:3000 tcp:3000` first and use `localhost` too.

## The one rule
`Flutter → Omnisift API → business logic → provider → SerpAPI`.
The client never calls SerpAPI or Supabase DB directly. See `docs/architecture/ARCHITECTURE.md`.

## Where things stand
All three apps are built and running — 18 backend controllers / 37 routes, the public web
surface, and 24 Flutter screens. See `OMNISIFT_STATUS.md` for the verified feature list,
the deliberate decisions that are *not* gaps (light-theme-only, flag-gated price graph,
guest browsing), and the known open items.

Working agreements for anyone (human or agent) changing this repo — frozen architecture,
guest-access policy, freshness policy, affiliate-redirect security rule, database-safety and
testing-integrity rules — are in the root `AGENTS.md`.
