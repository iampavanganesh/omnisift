import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ProductProvider,
  ProviderComparison,
} from '../../../../shared/interfaces/product-provider.interface';
import { NotFoundError } from '../../../../core/errors/app-error';
import { AppEvents, ProductPriceObservedPayload } from '../../../../core/events/app-events';
import { ProductAcquisitionService } from '../../../products/application/services/product-acquisition.service';
import { ProductExternalIdRepository } from '../../../products/domain/repositories/product-external-id.repository';
import { CompareCacheRepository } from '../../domain/repositories/compare-cache.repository';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { SearchCacheRepository } from '../../../search/domain/repositories/search-cache.repository';

/** Provider key for SerpAPI/Google external ids (compare + search origin). */
const SERPAPI_PROVIDER = 'serpapi';

/**
 * Multi-seller comparison. Reads compare_cache by token; on miss, fetches fresh
 * (single-flight), persists the catalog + compare cache, and heals the search
 * listing's price/rating/reviews for the same product (zero extra API).
 */
@Injectable()
export class GetComparisonUseCase {
  private readonly logger = new Logger(GetComparisonUseCase.name);

  constructor(
    private readonly provider: ProductProvider,
    private readonly acquisition: ProductAcquisitionService,
    private readonly cache: CompareCacheRepository,
    private readonly analytics: AnalyticsService,
    private readonly searchCache: SearchCacheRepository,
    private readonly events: EventEmitter2,
    private readonly externalIds: ProductExternalIdRepository, // ← NEW
  ) {}

  // Single-flight: one live fetch per token. If 10k users tap the same product
  // at once, one fetches and the rest await the SAME promise (0 extra API).
  private readonly inFlight = new Map<string, Promise<ProviderComparison>>();

  async execute(token: string, googleProductId?: string): Promise<ProviderComparison> {
    // 1) CACHE READ by TOKEN. Fresh row (within compare_cache_hours) -> serve, 0 API.
    const cached = await this.cache.findFreshByToken(token);
    if (cached) {
      this.logger.log(`🟢 COMPARE → CACHE HIT (0 API) | token`);
      this.syncSearch(googleProductId, cached); // heal search even on cache hit
      return cached;
    }

    // 2) Not cached / expired. Fetch fresh — one fetch per token; taps share it.
    const existing = this.inFlight.get(token);
    if (existing) {
      this.logger.log(`⏳ COMPARE → JOINED in-flight (0 API) | token`);
      return existing;
    }

    const flight = this.fetchAndStore(token, googleProductId);
    this.inFlight.set(token, flight);
    try {
      const result = await flight;
      // After a fresh fetch, heal this product's price/rating across search rows.
      this.syncSearch(googleProductId, result);
      return result;
    } finally {
      this.inFlight.delete(token);
    }
  }

  /** The real fetch + persist + cache write (keyed by token). */
  private async fetchAndStore(
    token: string,
    googleProductId?: string,
  ): Promise<ProviderComparison> {
    const comparison = await this.provider.getComparison(token);

    // Provider returned literally nothing (bad token / API failure) — nothing to
    // show at all. This is the ONLY case we treat as not-found.
    if (!comparison) {
      throw new NotFoundError('No comparison data available for this product.');
    }

    const sellerCount = comparison.sellers.length;

    // ZERO SELLERS but we DO have product data (title, image, specs). Do NOT throw.
    if (sellerCount === 0) {
      this.logger.log(`⚪ COMPARE → 1 API CALL | 0 sellers (product shown, no stores)`);
      const productId = await this.acquisition.acquireFromComparison(comparison);
      await this.cache.upsertByToken({
        token,
        productId,
        results: comparison,
        sellerCount: 0,
        lowestPrice: null,
      });
      // Link identity even with no price (future searches can resolve it).
      this.linkAndObserve(googleProductId, productId, null);
      (comparison as ProviderComparison & { internalProductId?: string }).internalProductId =
        productId;
      return comparison; // <-- return, DON'T throw
    }

    this.logger.log(`🔴 COMPARE → 1 API CALL | ${sellerCount} sellers`);
    const productId = await this.acquisition.acquireFromComparison(comparison);

    // sellers are cheapest-first (immersive mapper), so [0] is the lowest price.
    const lowestPrice = comparison.sellers[0]?.price ?? null;
    await this.cache.upsertByToken({
      token,
      productId,
      results: comparison,
      sellerCount,
      lowestPrice,
    });

    // Analytics: log the compare event (fire-and-forget, never blocks/throws).
    this.analytics.track('compare', {
      productId,
      brand: this.resolveBrand(comparison),
    });

    // Daily price snapshot (fire-and-forget; listener dedups to one row/product/day).
    const prices = comparison.sellers.map((s) => s.price).filter((p) => p > 0);
    if (prices.length > 0) {
      this.events.emit(AppEvents.PriceSnapshotRecorded, {
        productId,
        lowest: Math.min(...prices),
        highest: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
      });
    }

    // NEW: link google↔internal id + announce the observed lowest price (for alerts).
    this.linkAndObserve(googleProductId, productId, lowestPrice);

    (comparison as ProviderComparison & { internalProductId?: string }).internalProductId =
      productId;
    return comparison;
  }

  /**
   * Push fresh price/rating/reviews from a comparison back into search_cache so
   * search listings self-heal. Matched by the Google productId the app sends.
   */
  private syncSearch(googleProductId: string | undefined, comparison: ProviderComparison): void {
    if (!googleProductId) return;
    const price = comparison.sellers[0]?.price ?? null; // cheapest-first
    const fresh = {
      price,
      rating: comparison.rating ?? null,
      reviewCount: comparison.reviewCount ?? null,
    };
    this.searchCache
      .syncFromCompare(googleProductId, fresh)
      .then(() =>
        this.logger.log(`🔄 SEARCH SYNC ← compare | ${googleProductId} → ₹${price ?? '—'}`),
      )
      .catch((e) => this.logger.warn(`search sync failed for ${googleProductId}: ${String(e)}`));
  }

  /**
   * NEW: (1) persist the google↔internal id mapping so search-origin price
   * changes can later resolve to this product, and (2) emit ProductPriceObserved
   * with the internal id so the price-alert checker can evaluate it.
   * Fire-and-forget — never throws into the compare response.
   */
  private linkAndObserve(
    googleProductId: string | undefined,
    internalProductId: string,
    price: number | null,
  ): void {
    if (googleProductId) {
      this.externalIds
        .link(internalProductId, SERPAPI_PROVIDER, googleProductId)
        .catch((e) => this.logger.warn(`external-id link failed: ${String(e)}`));
    }
    if (price != null && price > 0) {
      const payload: ProductPriceObservedPayload = {
        internalProductId,
        externalId: googleProductId,
        provider: SERPAPI_PROVIDER,
        price,
        source: 'compare',
      };
      this.events.emit(AppEvents.ProductPriceObserved, payload);
      this.logger.log(`🔔 PRICE OBSERVED (compare) | ${internalProductId} → ₹${price}`);
    }
  }

  /**
   * Resolve a brand for analytics/catalog. Only real signals — no title
   * guessing here (that produced junk catalog entries like "Uncaged" from a
   * shoe titled "Uncaged Men's..."). '' means "no brand", not "unknown".
   */
  private resolveBrand(comparison: ProviderComparison): string {
    const direct = comparison.brand?.trim();
    if (direct) return direct;
    const brandSpec = comparison.specifications?.find(
      (s) => s.name?.trim().toLowerCase() === 'brand',
    );
    if (brandSpec?.value?.trim()) return brandSpec.value.trim();
    return '';
  }
}
