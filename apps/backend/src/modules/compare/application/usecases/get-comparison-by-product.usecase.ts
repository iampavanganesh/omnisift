// C:\omnisift_final\apps\backend\src\modules\compare\application\usecases\get-comparison-by-product.usecase.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ProductProvider,
  ProviderComparison,
} from '../../../../shared/interfaces/product-provider.interface';
import { NotFoundError } from '../../../../core/errors/app-error';
import { AppEvents, ProductPriceObservedPayload } from '../../../../core/events/app-events';
import { ProductAcquisitionService } from '../../../products/application/services/product-acquisition.service';
import { SearchCacheRepository } from '../../../search/domain/repositories/search-cache.repository';
import { CompareCacheRepository } from '../../domain/repositories/compare-cache.repository';

/** What the endpoint returns to the app. */
export interface CompareByProductResult {
  comparison: ProviderComparison;
  capturedAt: Date; // when this data was last fetched
  fresh: boolean; // true = served from cache within window; false = just refreshed
  refreshed: boolean; // true = we hit SerpApi this call
}

/**
 * Notification-tap flow. Given an internal productId:
 *  - Find the latest cached compare for that product.
 *  - If FRESH (within compare_cache_hours) -> serve it, 0 API.
 *  - If STALE -> re-fetch using the cached row's token (1 API), persist + heal
 *    search_cache, and serve fresh.
 *  - If the refetch fails/empties -> fall back to the stale cache (never error out).
 */
@Injectable()
export class GetComparisonByProductUseCase {
  private readonly logger = new Logger(GetComparisonByProductUseCase.name);

  constructor(
    private readonly provider: ProductProvider,
    private readonly acquisition: ProductAcquisitionService,
    private readonly cache: CompareCacheRepository,
    private readonly searchCache: SearchCacheRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(productId: string): Promise<CompareByProductResult> {
    const cached = await this.cache.findLatestByProduct(productId);
    if (!cached) {
      // No compare has ever been cached for this product — nothing to open.
      throw new NotFoundError('No comparison data available for this product yet.');
    }

    // Fresh enough — serve from DB, no API. The cached blob is whatever the
    // provider returned at capture time and never carries internalProductId
    // (only stamped onto the in-memory object below, after the cache write) —
    // stamp it here too, from the id we were called with, so every return
    // path (cache hit, refresh, stale fallback) resolves the same way.
    if (cached.fresh) {
      this.logger.log(`🟢 COMPARE-BY-PRODUCT → CACHE HIT (0 API) | ${productId}`);
      (cached.results as ProviderComparison & { internalProductId?: string }).internalProductId =
        productId;
      return {
        comparison: cached.results,
        capturedAt: cached.capturedAt,
        fresh: true,
        refreshed: false,
      };
    }

    // Stale — try to refresh using the cached token (1 API).
    if (cached.token) {
      try {
        const fresh = await this.provider.getComparison(cached.token);
        if (fresh && fresh.sellers.length > 0) {
          this.logger.log(`🔴 COMPARE-BY-PRODUCT → 1 API (refresh) | ${productId}`);

          const internalId = await this.acquisition.acquireFromComparison(fresh);
          const lowestPrice = fresh.sellers[0]?.price ?? null;
          await this.cache.upsertByToken({
            token: cached.token,
            productId: internalId,
            results: fresh,
            sellerCount: fresh.sellers.length,
            lowestPrice,
          });

          // Heal search_cache/wishlist with the fresh cheapest price (0 extra API).
          this.searchCache
            .syncFromCompare(internalId, {
              price: lowestPrice,
              rating: fresh.rating ?? null,
              reviewCount: fresh.reviewCount ?? null,
            })
            .catch((e) => this.logger.warn(`heal failed: ${String(e)}`));

          // Same downstream events GetComparisonUseCase emits on a live refresh
          // (daily snapshot dedup + price-alert evaluation) — this path re-fetches
          // just as freshly and must feed the same reactive pipeline.
          const freshPrices = fresh.sellers.map((s) => s.price).filter((p) => p > 0);
          if (freshPrices.length > 0) {
            this.events.emit(AppEvents.PriceSnapshotRecorded, {
              productId: internalId,
              lowest: Math.min(...freshPrices),
              highest: Math.max(...freshPrices),
              average: freshPrices.reduce((a, b) => a + b, 0) / freshPrices.length,
            });
          }
          if (lowestPrice != null && lowestPrice > 0) {
            const payload: ProductPriceObservedPayload = {
              internalProductId: internalId,
              price: lowestPrice,
              source: 'compare',
            };
            this.events.emit(AppEvents.ProductPriceObserved, payload);
            this.logger.log(
              `🔔 PRICE OBSERVED (compare-by-product) | ${internalId} → ₹${lowestPrice}`,
            );
          }

          (fresh as ProviderComparison & { internalProductId?: string }).internalProductId =
            internalId;
          return {
            comparison: fresh,
            capturedAt: new Date(),
            fresh: false,
            refreshed: true,
          };
        }
        // Empty/expired token — fall through to stale cache.
        this.logger.warn(`compare-by-product refresh returned empty | ${productId}`);
      } catch (e) {
        this.logger.warn(`compare-by-product refresh failed (${String(e)}) | ${productId}`);
      }
    }

    // Fallback: show the stale cache rather than an error.
    this.logger.log(
      `🟡 COMPARE-BY-PRODUCT → served STALE cache (refresh unavailable) | ${productId}`,
    );
    (cached.results as ProviderComparison & { internalProductId?: string }).internalProductId =
      productId;
    return {
      comparison: cached.results,
      capturedAt: cached.capturedAt,
      fresh: false,
      refreshed: false,
    };
  }
}
