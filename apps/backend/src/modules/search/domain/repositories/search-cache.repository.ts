import { ProviderProduct } from '../../../../shared/interfaces/product-provider.interface';

/**
 * Postgres-backed search store — ROWS model (one row per product per query).
 * Deduped by (normalizedQuery, productId). A query is "fresh" if its rows were
 * refreshed within the 7-day window; otherwise it is re-fetched from the provider.
 * Domain port — infrastructure provides the Prisma implementation.
 * Abstract class so it can double as a Nest DI token.
 */
export abstract class SearchCacheRepository {
  /**
   * All rows for this query IF it was refreshed within the freshness window,
   * ordered by position (provider/Google order). Returns null if the query is
   * stale or has no rows — the caller should then re-fetch from the provider.
   */
  abstract getFreshRows(normalizedQuery: string): Promise<ProviderProduct[] | null>;

  /**
   * All rows for this query regardless of age, ordered by position.
   * Used as graceful fallback when the provider is down.
   */
  abstract getAllRows(normalizedQuery: string): Promise<ProviderProduct[] | null>;

  /**
   * The most recent `refreshedAt` across all rows for this query, or null if the
   * query has no saved rows. Used to decide freshness against a runtime-configured
   * window (app_config.search_cache_days) — older than the window = refresh.
   */
  abstract getNewestRefreshedAt(normalizedQuery: string): Promise<Date | null>;

  /**
   * Upsert a batch of freshly-fetched products for this query:
   *  - dedup by (normalizedQuery, productId)
   *  - existing row  -> UPDATE (fresh wins) + refresh position/refreshedAt/lastSeenAt
   *  - new row       -> INSERT
   * `startPosition` is the position offset for this batch (e.g. page * pageSize),
   * so multi-page fetches keep a stable global order.
   */
  abstract refreshFromProvider(input: {
    normalizedQuery: string;
    rawQuery: string;
    products: ProviderProduct[];
    startPosition: number;
  }): Promise<void>;

  /**
   * Heal a product's price/rating/reviews across ALL search rows that hold it,
   * after a COMPARE fetch. Matched by Google productId. Zero extra API.
   */
  abstract syncFromCompare(
    productId: string,
    fresh: { price: number | null; rating: number | null; reviewCount: number | null },
  ): Promise<void>;

  /**
   * Current price for a set of productIds, read from the freshest search_cache
   * row per product. Returns a map productId -> price. Used by the wishlist to
   * show the live price beside each item's saved price. Missing products are
   * simply absent from the map (no current price known).
   */
  abstract getCurrentPrices(productIds: string[]): Promise<Map<string, number>>;
}
