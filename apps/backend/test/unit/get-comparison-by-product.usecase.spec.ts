import { describe, expect, it, vi } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetComparisonByProductUseCase } from '../../src/modules/compare/application/usecases/get-comparison-by-product.usecase';
import {
  ProductProvider,
  ProviderComparison,
} from '../../src/shared/interfaces/product-provider.interface';
import { ProductAcquisitionService } from '../../src/modules/products/application/services/product-acquisition.service';
import { SearchCacheRepository } from '../../src/modules/search/domain/repositories/search-cache.repository';
import {
  CachedCompareByProduct,
  CompareCacheRepository,
} from '../../src/modules/compare/domain/repositories/compare-cache.repository';
import { AppEvents } from '../../src/core/events/app-events';

/**
 * P0.2 regression: the notification-tap/scheduler refresh path must feed the
 * same reactive pipeline (PriceSnapshotRecorded + ProductPriceObserved) that
 * the token-based compare flow does — otherwise a scheduled refresh silently
 * never fires alerts or records a snapshot.
 */
function comparison(prices: number[]): ProviderComparison {
  return {
    title: 't',
    brand: 'b',
    description: '',
    rating: null,
    reviewCount: null,
    priceRange: '',
    images: [],
    specifications: [],
    sellers: prices.map((price) => ({
      platform: 'Amazon',
      price,
      currency: 'INR',
      link: 'https://real.example',
      logo: '',
      sellerTitle: '',
      tag: '',
      shipping: '',
      detailsAndOffers: [],
      rating: null,
      reviewCount: null,
      mrp: null,
      discountPct: null,
    })),
    aboutTitle: '',
    aboutLink: '',
    ratingBreakdown: [],
    userReviews: [],
    variants: [],
    relatedProducts: [],
    reviewsImages: [],
    videos: [],
  };
}

class FakeProvider extends ProductProvider {
  readonly slug = 'fake';
  search = vi.fn();
  getComparison = vi.fn(async (_token: string) => comparison([100, 120]));
}

class FakeCache extends CompareCacheRepository {
  findFreshByToken = vi.fn();
  findLatestByProduct = vi.fn(async (_productId: string): Promise<CachedCompareByProduct> => ({
    results: comparison([150]),
    token: 'tok-1',
    capturedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    fresh: false,
  }));
  upsertByToken = vi.fn(async () => undefined);
}

class FakeSearchCache extends SearchCacheRepository {
  getFreshRows = vi.fn();
  getAllRows = vi.fn();
  getNewestRefreshedAt = vi.fn();
  refreshFromProvider = vi.fn();
  syncFromCompare = vi.fn(async () => undefined);
  getCurrentPrices = vi.fn();
}

function fakeAcquisition(internalId: string) {
  return {
    acquireFromComparison: vi.fn(async () => internalId),
  } as unknown as ProductAcquisitionService;
}

describe('GetComparisonByProductUseCase — stale refresh reactive pipeline', () => {
  it('emits PriceSnapshotRecorded and ProductPriceObserved on a successful refresh, same as the token-based path', async () => {
    const provider = new FakeProvider();
    const cache = new FakeCache();
    const searchCache = new FakeSearchCache();
    const acquisition = fakeAcquisition('internal-1');
    const events = new EventEmitter2();
    const emitSpy = vi.spyOn(events, 'emit');

    const useCase = new GetComparisonByProductUseCase(
      provider,
      acquisition,
      cache,
      searchCache,
      events,
    );

    const result = await useCase.execute('internal-1');

    expect(result.refreshed).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(
      AppEvents.PriceSnapshotRecorded,
      expect.objectContaining({ productId: 'internal-1', lowest: 100, highest: 120 }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      AppEvents.ProductPriceObserved,
      expect.objectContaining({ internalProductId: 'internal-1', price: 100, source: 'compare' }),
    );
  });

  it('does not emit either event when the refresh yields zero sellers (falls through to stale cache)', async () => {
    const provider = new FakeProvider();
    provider.getComparison = vi.fn(async () => comparison([]));
    const cache = new FakeCache();
    const searchCache = new FakeSearchCache();
    const acquisition = fakeAcquisition('internal-1');
    const events = new EventEmitter2();
    const emitSpy = vi.spyOn(events, 'emit');

    const useCase = new GetComparisonByProductUseCase(
      provider,
      acquisition,
      cache,
      searchCache,
      events,
    );

    const result = await useCase.execute('internal-1');

    expect(result.refreshed).toBe(false);
    expect(emitSpy).not.toHaveBeenCalledWith(AppEvents.PriceSnapshotRecorded, expect.anything());
    expect(emitSpy).not.toHaveBeenCalledWith(AppEvents.ProductPriceObserved, expect.anything());
  });
});
