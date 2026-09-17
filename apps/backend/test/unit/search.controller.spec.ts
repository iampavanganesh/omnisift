import { describe, expect, it, vi } from 'vitest';
import { SearchController } from '../../src/modules/search/presentation/controllers/search.controller';
import { SearchProductsUseCase } from '../../src/modules/search/application/usecases/search-products.usecase';
import { GetSuggestionsUseCase } from '../../src/modules/search/application/usecases/get-suggestions.usecase';
import { ProviderProduct } from '../../src/shared/interfaces/product-provider.interface';
import { PAGINATION } from '../../src/shared/constants';

/**
 * P1 regression: `hasMore` must reflect the real page ceiling (searchSchema
 * Zod-enforces page <= MAX_PAGES - 1), never be inferred from "did this page
 * have results" alone — that's exactly the fake-infinite-scroll bug Flutter
 * had (search_controller.dart used to do `hasMore: products.isNotEmpty`).
 */
function product(overrides: Partial<ProviderProduct> = {}): ProviderProduct {
  return {
    token: 't1',
    productId: 'p1',
    title: 'Test Product',
    platform: 'Amazon',
    price: 100,
    oldPrice: null,
    currency: 'INR',
    imageUrl: 'https://example.com/i.jpg',
    productUrl: 'https://example.com/p',
    rating: null,
    reviewCount: null,
    delivery: '',
    position: null,
    source: '',
    sourceIcon: '',
    extractedPrice: null,
    extractedOldPrice: null,
    secondHandCondition: '',
    tag: '',
    extensions: [],
    serpapiProductApi: '',
    ...overrides,
  };
}

function fakeController(products: ProviderProduct[]) {
  const searchProducts = {
    execute: vi.fn(async () => ({ products, cached: false, stale: false })),
  } as unknown as SearchProductsUseCase;
  const getSuggestions = { execute: vi.fn() } as unknown as GetSuggestionsUseCase;
  return new SearchController(searchProducts, getSuggestions);
}

describe('SearchController — hasMore contract', () => {
  it('is true on a non-last page with results', async () => {
    const controller = fakeController([product()]);
    const res = await controller.search({ q: 'phone', page: 0 });
    expect(res.meta).toMatchObject({ hasMore: true, page: 0, count: 1 });
  });

  it('is false on the real last allowed page, even with results (the page-ceiling case)', async () => {
    const controller = fakeController([product()]);
    const res = await controller.search({ q: 'phone', page: PAGINATION.MAX_PAGES - 1 });
    expect(res.meta).toMatchObject({ hasMore: false, page: PAGINATION.MAX_PAGES - 1 });
  });

  it('is false when the page has no results at all', async () => {
    const controller = fakeController([]);
    const res = await controller.search({ q: 'phone', page: 0 });
    expect(res.meta).toMatchObject({ hasMore: false, count: 0 });
  });

  it('reflects the post-maxPrice-filter count, not the pre-filter count', async () => {
    const controller = fakeController([product({ price: 100 }), product({ price: 999 })]);
    const res = await controller.search({ q: 'phone', page: 0, maxPrice: 200 });
    expect(res.meta).toMatchObject({ hasMore: true, count: 1 }); // one survives the filter
  });
});
