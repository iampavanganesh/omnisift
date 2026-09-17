# ADR-0003: Web platform split — SSR app for public/SEO pages, Flutter Web for the authenticated app
- **Status:** accepted
- **Date:** 2026-09-06
- **Deciders:** Ganesh, Mohan

## Context
ARCHITECTURE.md §15 (ADR 009) committed to one Flutter codebase serving both Android and Web, to avoid maintaining two frontends. The web product plan now calls for a public, SEO-driven surface — category hubs, brand hubs, guides, product pages — intended to rank organically on Google and act as an acquisition channel.

Flutter Web renders client-side (CanvasKit or HTML renderer) with no server-side rendering. Per-route meta tags, fast time-to-first-byte, and reliable crawlability are weak on that stack. Building the SEO-first pages described in the web plan on Flutter Web would undermine the reason for building them.

## Decision
Split the web surface into two frontends against the same backend, rather than reversing ADR 009 outright:

- **New `apps/web`** (Next.js or equivalent SSR/SSG framework) owns the **public surface**: `/`, `/category/*`, `/brand/*`, `/brand/{brand}/{category}`, `/product/{slug}`, `/deals`, `/trending`, `/guides/*`. Server-rendered, reads only public data, calls the same NestJS API — `packages/api-contracts/openapi.yaml` remains the single contract for both frontends.
- **Flutter Web keeps the authenticated app surface**: wishlist, alerts, notifications, account, compare, and the conversational Omni adviser. Public pages link into these behind auth; visiting them unauthenticated redirects to sign-in. ADR 009 is narrowed, not reversed — Flutter still serves Android + the logged-in web experience.
- `apps/admin` stays deferred per ADR 016 — unaffected by this decision.
- `apps/web` inherits the same security posture as `apps/client`: strict CORS allowlist, CSP, public/private route separation, no service-role key ever shipped to either frontend (per the Web security plan already agreed).
- `apps/web`'s internal folder convention (data-fetching, no business logic in pages, no direct Supabase access) will be defined when that slice actually starts — not frozen today, same spirit as the 4-layer rule without forcing a Next.js app into a NestJS-shaped template.
- `packages/design-system` should stop being a pure "future marker" (ADR 016) at least for design tokens (color/spacing/type scale) — both Flutter and `apps/web` need to render the same brand, and duplicating token definitions in two places will drift.

## Consequences
(+) Delivers the SEO/organic-acquisition goal the web plan is built around. (+) `products` / `price-intelligence` / (future) `discovery` stay the single backend source of truth for both frontends — no logic duplicated server-side. (+) Public pages can be cached/CDN'd independently of the authenticated app.
(−) A second frontend codebase: more CI (`web-ci` workflow), more deploy surface, a second stack (Next.js/React) alongside Flutter. (−) Shared UI (product card, price badge, brand chip) must be rebuilt per-frontend unless design tokens are extracted early — see the design-system note above. (−) Some navigation logic (where does "Compare" live, public vs. app) needs an explicit call per page, not just "whatever's easiest."
