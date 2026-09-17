import { CatalogProductRow, VariantSibling } from './catalog-detail.types';

export interface ProductDetailSeller {
  sellerId: string;
  sellerName: string;
  price: number;
  mrp: number | null;
  discountPct: number | null;
  currency: string;
}

export interface ProductRatingBar {
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

/**
 * Read-only product detail, sourced entirely from the already-persisted catalog
 * (no live provider call). This backs the public product page — a live
 * SerpAPI-refresh comparison is an authenticated-app concern
 * (compare.compare-by-product), not something a public/crawler-facing page
 * should trigger on every view.
 */
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
  sellers: ProductDetailSeller[];
  /** Captured whenever a live comparison was fetched for this product (compare module) —
   * null until that's happened at least once, never fabricated. */
  rating: number | null;
  reviewCount: number | null;
  ratingBreakdown: ProductRatingBar[];
  reviews: ProductReview[];
}

export abstract class ProductQueryRepository {
  /** Null if the slug doesn't exist. */
  abstract getBySlug(slug: string): Promise<ProductDetail | null>;
  /** Other products in the same category, excluding this one. Empty if the product
   * has no category or no other products share it. Null if the id doesn't exist. */
  abstract getSimilar(productId: string, limit: number): Promise<CatalogProductRow[] | null>;
  /** Real cross-listing variant siblings (see VariantSibling) — includes the
   * product itself (isCurrent: true) plus any real other listings of the
   * same base model. Empty (not fabricated) when no real sibling exists —
   * the common case today. Null if the id doesn't exist. */
  abstract getVariantSiblings(productId: string): Promise<VariantSibling[] | null>;
}
