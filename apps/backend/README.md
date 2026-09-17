# Omnisift Backend (NestJS)

Clean Architecture · feature modules · Prisma · Supabase Postgres.

## Setup
```bash
cp .env.example .env        # fill in real values
npm install
npx prisma generate
npx prisma migrate dev      # create tables
psql "$DIRECT_URL" -f prisma/sql/enable_rls.sql   # enable RLS (run once, after migrate)
npm run prisma:seed         # provider + sellers
npm run start:dev
```
- API base: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs` (non-prod only — `setupSwagger` returns early when
  `NODE_ENV=production`, so the schema is never published from a deployed instance)

Export the OpenAPI contract to `packages/api-contracts/openapi.yaml`:
```bash
npm run export:openapi      # builds, then runs scripts/export-openapi.ts (no HTTP listener)
```

## Structure
```
src/
  bootstrap/   app + swagger wiring (no business logic)
  core/        config · database · logger · errors · security · events · middleware
  shared/      constants · types · interfaces (ProductProvider) · dto · utils
  modules/     feature modules (4-layer) — filled in slice by slice
    integrations/providers/serpapi/   provider impls live HERE, not in search
```

## Rules
- Thin controllers → use cases → repositories. No business logic in controllers.
- All config via `AppConfigService` (Zod-validated). Never read `process.env` directly.
- Errors extend `AppError`; the global filter renders safe JSON. Never leak stack traces.
- Every request carries an `x-request-id` correlation id (Pino).
- Providers implement `ProductProvider`. The client never calls SerpAPI.
