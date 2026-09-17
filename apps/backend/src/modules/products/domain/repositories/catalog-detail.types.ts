/** Shared shapes for category/brand detail pages — real catalog data, no search. */

export type CatalogSort = 'price_asc' | 'price_desc' | 'discount_desc' | 'newest';

export interface CatalogDetailQuery {
  sort: CatalogSort;
  page: number;
  pageSize: number;
  /** Cross-filter: on `GET /brands/:slug`, restrict to this category's slug. */
  category?: string;
  /** Cross-filter: on `GET /categories/:slug`, restrict to this brand's slug. */
  brand?: string;
  /** In-page facets (the filter sheet) — applied on top of any cross-filter above. */
  minPrice?: number;
  maxPrice?: number;
  /** Multi-select brand facet; only meaningful on `GET /categories/:slug`. */
  brands?: string[];
  minRating?: number;
  /** Real, data-driven spec facets (see CategoryFacet) — key -> OR'd values;
   * AND across different keys. Never a hardcoded taxonomy. */
  specs?: Record<string, string[]>;
}

/** One product row, price/discount computed from its IN_STOCK listings only. */
export interface CatalogProductRow {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  lowestPrice: number | null;
  discountPct: number | null;
  sellerCount: number;
}

export interface CatalogInsights {
  productCount: number;
  avgLowestPrice: number | null;
  topDiscountPct: number | null;
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

export interface SellerRef {
  id: string;
  name: string;
  productCount: number;
}

/** A REAL other product — a separately-scraped listing that is the same base
 *  model as the one being viewed, differing only by its own distinct
 *  colour/storage/etc (see variantBaseSignature). Unlike ProductVariantOption
 *  above, this carries a real productId/slug/price: selecting it is an actual
 *  navigation to that product's own real price and seller list, not a
 *  cosmetic toggle. `isCurrent` marks the product being viewed so callers can
 *  render one unified list. Empty whenever no such real duplicate listing
 *  exists yet — which is the common case today; never fabricated. */
export interface VariantSibling {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  /** The real single-valued specs that distinguish this listing, e.g. "256 GB · Blue". */
  label: string;
  lowestPrice: number | null;
  isCurrent: boolean;
}
