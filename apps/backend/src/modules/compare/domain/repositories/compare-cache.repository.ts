import { ProviderComparison } from '../../../../shared/interfaces/product-provider.interface';

/** What a by-product lookup returns: the cached comparison, its token, and freshness. */
export interface CachedCompareByProduct {
  results: ProviderComparison;
  token: string | null;
  capturedAt: Date;
  fresh: boolean; // true if within compare_cache_hours
}

/**
 * Postgres-backed compare cache. Looked up by the provider TOKEN (what the app
 * has on tap). Expiry window comes from app_config.compare_cache_hours. Domain
 * port; infra provides the impl.
 */
export abstract class CompareCacheRepository {
  /** Fresh (non-expired) comparison for this TOKEN, or null. */
  abstract findFreshByToken(token: string): Promise<ProviderComparison | null>;

  /**
   * Latest cached comparison for a PRODUCT (by internal productId), regardless of
   * age. Returns the token + capturedAt + a `fresh` flag (within the window), so
   * the caller can serve it as-is or refresh via the token. Null if none exists.
   */
  abstract findLatestByProduct(productId: string): Promise<CachedCompareByProduct | null>;

  /**
   * Upsert the snapshot, keyed by TOKEN. Also stores the catalog productId (for
   * the product relation) and resets expiry from compare_cache_hours.
   */
  abstract upsertByToken(input: {
    token: string;
    productId: string | null;
    results: ProviderComparison | { sellers: [] };
    sellerCount: number;
    lowestPrice: number | null;
  }): Promise<void>;
}
