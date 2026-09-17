# ADR-0002: Omni AI — rules-first, LLM-optional shopping intelligence
- **Status:** accepted
- **Date:** 2026-09-06
- **Deciders:** Ganesh, Mohan

## Context
ARCHITECTURE.md §14 lists "AI/ML matching · AI recommendations" as explicitly **not** in V1. The product roadmap now calls for two AI-adjacent experiences:

1. **Product Omni** — a per-product "why buy this" explanation (price vs. average, spec scores, budget fit) on every product page.
2. **Shopping Adviser** — a conversational assistant that takes messy natural-language requests ("something for gaming and camera, under ₹35k") and turns them into a search/ranking.

These are not the same capability and don't carry the same cost or risk, so they shouldn't be decided together.

## Decision
Split §14's AI exclusion instead of blanket-reopening it:

- **Product Omni ships in V1, with zero model calls.** It's deterministic: rules over data already owned by `price-intelligence` and `products` (price vs. 30-day average, spec scores, budget fit) rendered through a template/NLG layer. Per ADR rule #017 ("feature folders only when building"), this logic lives inside the existing `price-intelligence` / `products` modules — **no new `shopping-intelligence` module yet.**
- **Shopping Adviser (the actual LLM piece) is deferred out of V1.** When it's built:
  - It sits behind an `AIProvider` interface, mirroring the existing `ProductProvider` abstraction — no model hard-coded, swappable later.
  - Intent parsing tries rules first (keyword/budget/category extraction); the LLM is called only when rules can't parse the request, and returns structured JSON (intent), never raw prose fed back into business logic.
  - Start on a free/low-cost tier (e.g. Gemini free tier) with a hard per-user-per-day quota; only move to a paid model after usage data justifies the cost.
  - At that point, extract `modules/shopping-intelligence/` (application: `product-advisor`, `shopping-advisor`, `scoring`, `explanations`; standard domain/infrastructure/presentation layers) and `integrations/ai/` (provider implementations), matching how `integrations/serpapi` already sits outside `modules/`.

## Consequences
(+) Ships a differentiated "Why buy this" feature in V1 with no AI cost, no new vendor risk, and no dependency on an LLM being available. (+) Keeps the moat framing correct — the catalog/price-history data is the asset, the model is optional. (+) `AIProvider` avoids provider lock-in when the Adviser is eventually built.
(−) Conversational Shopping Adviser slips to V2 — set expectations with marketing/growth accordingly. (−) Requires discipline to keep "Product Omni" scoped as business logic, not let it quietly grow into an AI module before the Adviser actually needs one.

## Implementation note (2026-09-06)
Product Omni v1 shipped as `computeProductOmni()` in `apps/backend/src/shared/domain/compute-product-omni.ts` — a pure function (price spread, discount, seller-count signals; no DB, no DI), not inside `price-intelligence` as originally sketched above. Reason: it's called from two independent response paths that don't share a module — `compare`'s `ComparisonResponseDto` (the live SerpAPI-backed path the Flutter app's product screen uses) and `products`' `ProductDetailResponseDto` (the DB-only path apps/web uses) — and neither imports the other's module tree. A stateless `shared/` function avoided a cross-module dependency for what is, correctly, a leaf computation. Surfaced today via "Omni's Take" on both the Flutter product detail screen and the apps/web product page. Scoring is intentionally coarse (price-spread %, max discount %, seller count) — no 30-day-average or spec-based scoring yet, since that needs `price-intelligence`'s historical data, not just the current snapshot this reads today.
