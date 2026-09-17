import { describe, expect, it, vi } from 'vitest';
import { PrismaAffiliateClickRepository } from '../../src/modules/affiliate/infrastructure/repositories/prisma-affiliate-click.repository';
import { NotFoundError } from '../../src/core/errors/app-error';

/**
 * Security-relevant: this repository must NEVER persist a client-supplied
 * destination URL. It must always derive `targetUrl` from a real, resolved
 * ProductListing, and fail closed (reject the click) when no such listing
 * exists rather than trusting anything the caller asserted.
 *
 * A minimal typed fake stands in for PrismaService — only the sub-objects
 * this repository actually touches (seller/productListing/affiliateClick).
 */
function fakePrisma(overrides: {
  seller?: { id: string } | null;
  listing?: { id: string; productUrl: string } | null;
}) {
  const createSpy = vi.fn(async (args: { data: Record<string, unknown> }) => ({
    id: 'click-1',
    productId: args.data.productId,
    targetUrl: args.data.targetUrl,
    clickedAt: new Date(),
    product: { title: 'Some Product', primaryImageUrl: null },
    seller: { name: 'Amazon' },
  }));
  return {
    prisma: {
      seller: { findUnique: vi.fn(async () => overrides.seller ?? null) },
      productListing: { findFirst: vi.fn(async () => overrides.listing ?? null) },
      affiliateClick: { create: createSpy },
    },
    createSpy,
  };
}

describe('PrismaAffiliateClickRepository.record', () => {
  it('derives targetUrl from the real matching listing, ignoring any client claim', async () => {
    const { prisma, createSpy } = fakePrisma({
      seller: { id: 'seller-1' },
      listing: { id: 'listing-1', productUrl: 'https://real-seller.example/product/x' },
    });

    const repo = new PrismaAffiliateClickRepository(prisma as any);

    const click = await repo.record('user-1', { productId: 'product-1', platform: 'Amazon' });

    expect(click.targetUrl).toBe('https://real-seller.example/product/x');
    expect(createSpy).toHaveBeenCalledOnce();
    const dataArg = createSpy.mock.calls[0][0].data;
    expect(dataArg.targetUrl).toBe('https://real-seller.example/product/x');
    expect(dataArg.listingId).toBe('listing-1');
  });

  it('rejects (fails closed) when the platform does not resolve to a known seller', async () => {
    const { prisma, createSpy } = fakePrisma({ seller: null });

    const repo = new PrismaAffiliateClickRepository(prisma as any);

    await expect(
      repo.record('user-1', { productId: 'product-1', platform: 'NotARealStore' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects (fails closed) when the seller is real but has no listing for this product — never falls back to a client-asserted URL', async () => {
    const { prisma, createSpy } = fakePrisma({ seller: { id: 'seller-1' }, listing: null });

    const repo = new PrismaAffiliateClickRepository(prisma as any);

    await expect(
      repo.record('user-1', { productId: 'product-1', platform: 'Amazon' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
