import { describe, expect, it, vi } from 'vitest';
import { AffiliateRedirectController } from '../../src/modules/affiliate/presentation/controllers/affiliate-redirect.controller';
import { ListingLookupRepository } from '../../src/modules/affiliate/domain/repositories/listing-lookup.repository';
import { AnalyticsService } from '../../src/core/analytics/analytics.service';
import { NotFoundError } from '../../src/core/errors/app-error';

/**
 * P0 acceptance: there must be no client path capable of forcing this
 * endpoint to redirect anywhere other than a real, resolved listing URL.
 * Every case here is a real DB relationship (or the deliberate absence of
 * one) — never a client-supplied destination.
 */
class FakeListingLookupRepository extends ListingLookupRepository {
  findUrl = vi.fn(async (productId: string, sellerId: string) => {
    if (productId === 'product-1' && sellerId === 'seller-1') return 'https://real.example/listing';
    return null; // no relationship between this product and this seller
  });
  findUrlByPlatform = vi.fn(async (productId: string, platform: string) => {
    if (productId === 'product-1' && platform === 'Amazon') return 'https://real.example/listing';
    return null;
  });
}

function fakeAnalytics() {
  return { track: vi.fn() } as unknown as AnalyticsService;
}

describe('AffiliateRedirectController', () => {
  describe('go (productId + sellerId)', () => {
    it('redirects to the real listing URL for a valid product/seller pair', async () => {
      const listings = new FakeListingLookupRepository();
      const controller = new AffiliateRedirectController(listings, fakeAnalytics());

      const result = await controller.go('product-1', 'seller-1');

      expect(result).toEqual({ url: 'https://real.example/listing', statusCode: 302 });
    });

    it('rejects a seller that has no relationship with the given product (seller A for product B)', async () => {
      const listings = new FakeListingLookupRepository();
      const controller = new AffiliateRedirectController(listings, fakeAnalytics());

      await expect(controller.go('product-1', 'seller-does-not-sell-this')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('rejects a missing/unknown product', async () => {
      const listings = new FakeListingLookupRepository();
      const controller = new AffiliateRedirectController(listings, fakeAnalytics());
      await expect(controller.go('no-such-product', 'seller-1')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('rejects a malformed id rather than ever forwarding it as a destination', async () => {
      const listings = new FakeListingLookupRepository();
      const controller = new AffiliateRedirectController(listings, fakeAnalytics());
      await expect(controller.go('<script>alert(1)</script>', 'seller-1')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('goByPlatform (productId + platform name)', () => {
    it('redirects to the real listing URL when the platform resolves to a real seller with a real listing', async () => {
      const listings = new FakeListingLookupRepository();
      const controller = new AffiliateRedirectController(listings, fakeAnalytics());

      const result = await controller.goByPlatform('product-1', 'Amazon');

      expect(result).toEqual({ url: 'https://real.example/listing', statusCode: 302 });
    });

    it('rejects an unknown platform name', async () => {
      const listings = new FakeListingLookupRepository();
      const controller = new AffiliateRedirectController(listings, fakeAnalytics());
      await expect(
        controller.goByPlatform('product-1', 'TotallyMadeUpStore'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
