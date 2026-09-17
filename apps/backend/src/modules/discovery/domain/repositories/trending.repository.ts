import { CatalogProductRow } from '../../../products/domain/repositories/catalog-detail.types';
import { ProviderProduct } from '../../../../shared/interfaces/product-provider.interface';

export interface MostSearchedResult {
  product: ProviderProduct;
  /** Real, un-inflated count of searches for this product's ranking query,
   * within the requested window. */
  searchCount: number;
}

/**
 * "Trending" read model. V1 has no per-product popularity signal to draw on —
 * QueryStatsDaily tracks search query text, not which product a searcher
 * clicked into — so this is a deliberate proxy, not real trending data. See
 * PrismaTrendingRepository for what it actually orders by.
 */
export abstract class TrendingRepository {
  abstract listTrending(limit: number): Promise<CatalogProductRow[]>;

  /**
   * Real "most searched" signal: the top-ranked cached result for each of the
   * most-frequently-searched queries (analytics_events) in the last `hours`
   * hours, deduped by product. See PrismaTrendingRepository for the query.
   */
  abstract listMostSearched(hours: number, limit: number): Promise<MostSearchedResult[]>;

  /** Same signal, filtered to one category (by slug — resolved to the real
   * category name, then matched via the same categorize() used by search
   * results — real per-product categorization, no new signal). Null if the
   * slug doesn't resolve to a real category. */
  abstract listMostSearchedInCategory(
    categorySlug: string,
    hours: number,
    limit: number,
  ): Promise<MostSearchedResult[] | null>;
}
