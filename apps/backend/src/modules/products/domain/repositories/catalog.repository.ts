import { ProviderComparison } from '../../../../shared/interfaces/product-provider.interface';
import { PriceObservation } from '../../../../core/events/app-events';

export interface PersistedComparison {
  /** Canonical Omnisift product id (products.id). */
  productId: string;
  /** One observation per persisted seller listing — feeds price_history. */
  observations: PriceObservation[];
}

/**
 * Persistence port for the canonical catalog (products · brands · sellers ·
 * product_listings · prices). Repositories only store/retrieve — business
 * decisions live in the Product Acquisition Service (ARCHITECTURE.md §6).
 */
export abstract class CatalogRepository {
  /**
   * Persist a provider comparison into the canonical catalog in one transaction:
   * resolve/create the Product (dedup by normalizedTitle) + Brand, upsert each
   * Seller + ProductListing + current Price. Returns the canonical product id
   * and the per-listing price observations (for the append-only history log).
   */
  abstract persistComparison(comparison: ProviderComparison): Promise<PersistedComparison>;
}
