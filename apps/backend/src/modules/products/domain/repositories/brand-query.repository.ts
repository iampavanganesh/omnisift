import {
  CatalogDetailQuery,
  CatalogInsights,
  CatalogProductRow,
  CategoryRef,
  SellerRef,
} from './catalog-detail.types';

export interface BrandWithCount {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  logoUrl: string | null;
  description: string | null;
}

export interface BrandDetail {
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
  };
  insights: CatalogInsights;
  categoriesForBrand: CategoryRef[];
  sellersForBrand: SellerRef[];
  products: CatalogProductRow[];
  hasMore: boolean;
}

/** Read-only listing of the catalog's brands, for brand-browse UI. */
export abstract class BrandQueryRepository {
  abstract listWithCounts(): Promise<BrandWithCount[]>;
  /** Real catalog detail for one brand (null if the slug doesn't exist). */
  abstract getDetail(slug: string, query: CatalogDetailQuery): Promise<BrandDetail | null>;
}
