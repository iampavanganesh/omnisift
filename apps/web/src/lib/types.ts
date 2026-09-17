/**
 * Mirrors the backend's actual response DTOs (see apps/backend/src/modules/{products,
 * deals,discovery,search}). Replace with types generated from
 * packages/api-contracts/openapi.yaml once that spec is real — until then, keep this in
 * sync by hand when a backend DTO changes shape.
 */

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

export interface BrandSummary {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  logoUrl: string | null;
  description: string | null;
}

export interface CatalogInsights {
  productCount: number;
  avgLowestPrice: number | null;
  topDiscountPct: number | null;
}

/** One product row inside a category/brand detail or the trending feed. */
export interface CatalogProduct {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  lowestPrice: number | null;
  discountPct: number | null;
  sellerCount: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface BrandRef {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  logoUrl: string | null;
}

/** A real, data-driven filter facet — a spec key that actually repeats with
 * multiple distinct values across a category's real products right now.
 * Never a hardcoded per-category taxonomy. */
export interface CategoryFacet {
  key: string;
  values: { value: string; count: number }[];
}

/** A REAL other product — a separately-scraped listing of the same base
 * model, differing only by its own distinct colour/storage/etc. This is a
 * real navigable product with its own price. isCurrent marks the one being
 * viewed. Empty when no such real duplicate listing exists yet (the common
 * case today) — never fabricated. */
export interface VariantSibling {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  label: string;
  lowestPrice: number | null;
  isCurrent: boolean;
}

export interface CategoryDetail {
  category: { id: string; name: string; slug: string };
  insights: CatalogInsights;
  brandsInCategory: BrandRef[];
  /** The category's single biggest current discount, or null if nothing in
   * it has a real discount right now — never fabricated. */
  topDeal: CatalogProduct | null;
  products: CatalogProduct[];
  hasMore: boolean;
}

/** GET /discovery/most-searched(/:category) row — a CatalogProduct-shaped
 * search result (pre-catalog, so linked via `/product/{slug}` isn't always
 * valid — see SearchProduct) plus the real, un-inflated search count that
 * ranked it. */
export interface MostSearchedProduct {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  brand: string;
  category: string;
  /** Real count of searches for this product's ranking query in the window —
   * never rounded up for effect. */
  searchCount: number;
}

export interface BrandDetail {
  brand: { id: string; name: string; slug: string; logoUrl: string | null; description: string | null };
  insights: CatalogInsights;
  categoriesForBrand: CategoryRef[];
  sellersForBrand: { id: string; name: string; productCount: number }[];
  products: CatalogProduct[];
  hasMore: boolean;
}

/** GET /deals row — a different shape from CatalogProduct (pre-dates it; not worth
 * forcing into the same type just for uniformity). */
export interface DealProduct {
  productId: string;
  productSlug: string;
  title: string;
  imageUrl: string | null;
  platform: string;
  price: number;
  mrp: number | null;
  discountPct: number;
  currency: string;
}

/** GET /search row. No canonical id/slug — search results are pre-catalog until a
 * comparison is actually opened (see ARCHITECTURE.md's acquisition flow), so these
 * aren't linkable to /product/{slug} yet. */
export interface SearchProduct {
  token: string;
  productId: string;
  title: string;
  platform: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  imageUrl: string;
  rating: number | null;
  reviewCount: number | null;
  delivery: string;
  brand: string;
}

export interface ProductSeller {
  sellerId: string;
  sellerName: string;
  price: number;
  mrp: number | null;
  discountPct: number | null;
  currency: string;
}

export interface ProductOmniTake {
  headline: string;
  reasons: Array<{ tone: "positive" | "caution"; text: string }>;
}

export interface RatingBar {
  stars: number;
  amount: number;
}

export interface ProductReview {
  title: string;
  text: string;
  userName: string;
  source: string;
  rating: number | null;
  date: string;
}

/** GET /config. Client-facing feature flags/dials — read once per request that
 * needs them, never assumed on. */
export interface RuntimeConfig {
  maxApiCalls: number;
  priceGraphEnabled: boolean;
}

/** GET /products/history?productId=. One real daily snapshot across all
 * sellers — empty until at least one has been recorded for this product. */
export interface PricePoint {
  lowest: number;
  highest: number;
  average: number;
  capturedAt: string;
}

/** GET /products/slug/:slug. `rating`/`reviewCount`/`reviews` are only populated once a
 * live comparison has been fetched for this product at least once (compare module) —
 * null/empty until then, never fabricated. */
export interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  imageUrl: string | null;
  images: string[];
  specs: Record<string, string> | null;
  lowestPrice: number | null;
  sellers: ProductSeller[];
  omni: ProductOmniTake | null;
  rating: number | null;
  reviewCount: number | null;
  ratingBreakdown: RatingBar[];
  reviews: ProductReview[];
}
