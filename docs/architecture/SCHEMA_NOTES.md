# Omnisift — Database Schema Notes (V1)

Companion to `schema.prisma`. Explains *why* each table exists, the identity model, and the decisions I made (including where I deviated from the original 16-table list — flagged clearly).

Validated with the Prisma schema validator: **17 models, 3 enums, 0 errors.**

---

## How this maps to the architecture

- **PostgreSQL (Supabase) is the source of truth.** The backend is the only writer; Flutter never touches these tables (Boundary Rule).
- **The canonical catalog is the primary asset.** `products` is the centre; provider listings *attach* to it, they don't define it.
- **Price history is append-only.** `price_history` rows are only ever inserted.
- **Providers are replaceable.** `providers` records the data source (SerpAPI today); nothing else in the schema is coupled to it.

---

## The identity chain (the most important concept)

Three different things people often conflate — kept separate on purpose:

| Table | Answers | Example |
|---|---|---|
| `providers` | *How did we get this data?* (data source) | SerpAPI |
| `sellers` | *Who sells it?* (store / marketplace) | Amazon.in, Flipkart, AJIO |
| `product_listings` | *This Omnisift product, as offered by a seller* | iPhone 17 @ Amazon, ASIN B0XXXX |

```
Provider (SerpAPI)
   + Seller (Amazon.in) + sellerProductId (ASIN B0XXXX)
        │
        ▼
   ProductListing L001  ─────►  Omnisift Product P001 (canonical)
        ▲
   ProductListing L002  ─────►  Omnisift Product P001
   (Flipkart, FK123)
```

- `@@unique([sellerId, sellerProductId])` on `product_listings` enforces **no duplicates within a store** — the V1 identity rule.
- Cross-provider matching (deciding L001 and L002 are the *same* product) stays in application code, conservative, no AI. The schema supports it; it doesn't force it.

---

## Per-table rationale

### Users
- **`users`** — profile only. `id` **equals the Supabase Auth uid** (no `@default` — it's set from `auth.users.id` at profile creation). No password/credentials here; Supabase Auth owns those (per PRD: "password never stored locally").

### Catalog
- **`brands`, `categories`** — lightweight lookup tables. *(These are additions — see Deviations below.)* They exist because your PRD search filters need Brand and Category, and lookups dedupe better than free-text columns.
- **`products`** — the canonical product. `normalizedTitle` (cleaned/lowercased) drives dedup + search matching. `images`/`specs` are `Json` so we don't over-model spec shapes in V1.
- **`product_variants`** — e.g. "128GB Blue". Optional; a listing can point at a product with no variant. `attributes` is `Json`.

### Identity chain
- **`providers`** — data-acquisition sources (SerpAPI now; Amazon/Flipkart APIs later). Provenance + the abstraction the handbook mandates.
- **`sellers`** — the actual stores/marketplaces a listing belongs to.
- **`product_listings`** — the product-at-a-seller join, carrying the store's `sellerProductId`, buy URL, and currency. The volatile *price* lives separately (below) so identity/URL stay stable while prices churn.

### Prices
- **`prices`** — the **current** offer, one row per listing (1:1). Fast reads for "lowest price / N stores" without scanning history. Mutable (upserted on refresh).
- **`price_history`** — **append-only** log. Every observation inserted, never overwritten. Indexed `(listingId, observedAt)` for trend charts and lowest/highest lookups. A background job trims beyond the rolling window (~1 year). *This is the moat.*

> Why both? `prices` = "what is it now" (speed); `price_history` = "what has it been" (intelligence). Keeping them apart means the hot read path never scans the growing log.

### Caches (Postgres-based, no Redis in V1)
- **`search_cache`** — keyed by `normalizedQuery` (unique), 7-day `expiresAt`. `results` is a `Json` snapshot of product refs. Designed so we can later shift query-cache-first → catalog-first **without changing the API contract**.
- **`compare_cache`** — one row per product (unique `productId`), 24-hour `expiresAt`. Stores `lowestPrice` + `sellerCount` for instant compare reads.

### User engine
- **`wishlist_items`** — user↔product, `@@unique([userId, productId])`. *(Merged from wishlists+wishlist_items — see Deviations.)*
- **`price_alerts`** — user↔product rule. `type` (`ANY_DROP` | `BELOW_TARGET`), optional `targetPrice`, `isActive`, `lastTriggeredAt`/`lastNotifiedPrice` so the worker doesn't re-notify on the same drop.

### Monetization + telemetry
- **`affiliate_clicks`** — outbound click tracking (user, product, listing, seller, target URL, network/tracking id). Powers affiliate CTR/conversion metrics.
- **`analytics_events`** — generic event sink. `userId` is **nullable** because some events fire *before* login (App Open, Welcome Viewed — per PRD). `properties` is `Json`.
- **`notifications`** — in-app notification records (price drop, alert triggered, system). `isRead` + `readAt`.

---

## Referential actions (onDelete)

- **User-owned data** (`wishlist_items`, `price_alerts`, `affiliate_clicks`, `notifications`) → **Cascade**. Satisfies PRD "delete account + associated data." (`analytics_events` → SetNull, so we keep anonymized product/business metrics after account deletion.)
- **Catalog** (`product_variants`, `product_listings`, `prices`, `price_history`, `compare_cache`) → **Cascade** from their parent product/listing.
- **`sellers`, `providers`** referenced by listings/history → **Restrict** (can't delete a provider/seller that still has data).
- **`brands`, `categories`** on product, and `variant` on listing → **SetNull** (deleting a brand must not delete products).

---

## Row-Level Security (RLS) — not in this file

Prisma can't express RLS policies. Per our model, the **backend is the only DB client (service_role)** and Flutter never connects directly, so:
- Enable RLS on all tables and default-deny.
- Grant access to `service_role` only.
- This goes in a **separate SQL migration**, not `schema.prisma`. I'll include it in deliverable #3 (scaffold/foundation).

---

## ⚠️ Deviations from your original 16-table list (flagged)

1. **Added `brands` + `categories`** (2 new tables). Reason: PRD filters need Brand + Category; lookup tables dedupe and index better than string columns. *Reversible:* if you'd rather keep them as plain columns on `products`, say so and I'll collapse them.
2. **Merged `wishlists` + `wishlist_items` → just `wishlist_items`** (keyed directly by `userId`). Reason: V1 has one implicit wishlist per user; a separate `wishlists` table with exactly one row per user is the "empty boundary" anti-pattern your own Final Architecture doc warns against (Principle 8). *Reversible:* when multiple named lists become a real feature, add `wishlists` and point items at it — one migration.

Everything else matches your list 1:1.

---

## Open questions (your call before I lock this)

1. **Brands/Categories as tables (my default) or plain columns?** I went with tables.
2. **Wishlist merged (my default) or keep the two-table version?** I merged.
3. **`prices` as a separate 1:1 table (my default) or fold current price into `product_listings`?** I kept it separate for read-path cleanliness — minor either way.

If you're fine with all three defaults, just say so and this is the frozen schema.

---

## Not modeled yet (deferred, by design)

Guest/anonymous sessions · multiple named wishlists · seller reputation scores · product reviews storage · coupons · category hierarchy (sub-categories) · multi-currency beyond INR · adaptive-refresh metadata. All addable without reshaping the core — deferred to keep V1 lean.
