import {
  BrandRef,
  CatalogDetailQuery,
  CatalogInsights,
  CatalogProductRow,
} from './catalog-detail.types';

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

/** A real, data-driven filter facet — a spec key that actually repeats with
 * multiple distinct values across this category's real products. Never a
 * hardcoded per-category taxonomy; see PrismaCategoryQueryRepository.getFacets. */
export interface CategoryFacet {
  key: string;
  values: { value: string; count: number }[];
}

export interface CategoryDetail {
  category: { id: string; name: string; slug: string };
  insights: CatalogInsights;
  brandsInCategory: BrandRef[];
  /** The single product with this category's highest current discountPct, or
   * null if none has one. Powers the "Biggest price drop" intelligence card —
   * computed from the already-fetched `products`, no extra query. */
  topDeal: CatalogProductRow | null;
  products: CatalogProductRow[];
  hasMore: boolean;
}

/** Read-only listing of the catalog's categories, for category-browse UI. */
export abstract class CategoryQueryRepository {
  abstract listWithCounts(): Promise<CategoryWithCount[]>;
  /** Real catalog detail for one category (null if the slug doesn't exist). */
  abstract getDetail(slug: string, query: CatalogDetailQuery): Promise<CategoryDetail | null>;
  /** Real filter facets for one category (null if the slug doesn't exist). */
  abstract getFacets(slug: string): Promise<CategoryFacet[] | null>;
}
