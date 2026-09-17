# apps/web — Omnisift public/SEO surface

Next.js (App Router). Owns the public, indexable side of Omnisift: home, category hubs,
brand hubs, product pages, deals, trending, and buying guides. See
[ADR-0003](../../docs/adr/ADR-0003-web-platform-split.md) for why this exists as a
separate app from `apps/client` (Flutter).

## Boundary rules (non-negotiable — ADR-0003)

- **Public surface only.** Wishlist, alerts, notifications, account, compare, and the
  Omni chat adviser all live on `apps/client` (Flutter Web). This app links out to
  `NEXT_PUBLIC_APP_URL` for those — it doesn't implement them.
- **No direct Supabase access, ever.** All data comes from the backend API via
  `src/lib/api-client.ts`. No service-role key, no Supabase client, in this app.
- **Server-only vs. public env vars matter.** `API_BASE_URL` (server-only) is for SSR
  fetches; `NEXT_PUBLIC_API_URL` is the browser-reachable variant, used only where a
  link genuinely needs to be clicked directly (e.g. affiliate redirects). Don't swap
  these — the whole point is that a plain `NEXT_PUBLIC_*` var is visible in the bundle.
- **Never link a raw seller URL.** Product pages link through the backend's affiliate
  redirect (`/affiliate/go/product/{id}/seller/{id}`) — see the security plan in
  ARCHITECTURE.md. Don't reintroduce a `?url=` style redirect.

## Status

This is a scaffold. Every page renders real routes, metadata, and layout, but most data
sections show an explicit "coming soon" placeholder (`EmptyState`) because the
backend's `discovery` module and Product Omni explanation layer don't exist yet
(ADR-0002, ADR-0003). Search `apiClient.get(` for every call site that's waiting on a
real endpoint.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home |
| `/search?q=` | Search results (noindexed — see `robots.ts`) |
| `/category`, `/category/[slug]` | Category index + hub |
| `/brand`, `/brand/[slug]`, `/brand/[brand]/[category]` | Brand index + hub + brand×category |
| `/product/[slug]` | Product intelligence page |
| `/deals`, `/trending` | Discovery pages |
| `/guides`, `/guides/[slug]` | Editorial buying guides (local fixture — see `lib/guides-data.ts`) |

## Run locally

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Runs on `http://localhost:3001` by default (set `-p 3001` or a `PORT` env var — Next
defaults to 3000, which collides with `apps/backend`).

## Design tokens

`src/app/globals.css` defines CSS custom properties that mirror
`packages/design-system/tokens.json`. There's no build-time pipeline syncing them yet —
if you change one, change both, until that's built.
