import { describe, expect, it, vi } from 'vitest';
import { PrismaListingLookupRepository } from '../../src/modules/affiliate/infrastructure/repositories/prisma-listing-lookup.repository';

function fakePrisma(overrides: {
  seller?: { id: string } | null;
  listing?: { productUrl: string } | null;
}) {
  return {
    seller: { findUnique: vi.fn(async () => overrides.seller ?? null) },
    productListing: { findFirst: vi.fn(async () => overrides.listing ?? null) },
  };
}

describe('PrismaListingLookupRepository', () => {
  describe('findUrl', () => {
    it('returns the real listing URL for a valid (product, seller) pair', async () => {
      const prisma = fakePrisma({ listing: { productUrl: 'https://real.example/p' } });

      const repo = new PrismaListingLookupRepository(prisma as any);
      await expect(repo.findUrl('product-1', 'seller-1')).resolves.toBe('https://real.example/p');
    });

    it('returns null when no listing exists for that pair (never guesses/falls back)', async () => {
      const prisma = fakePrisma({ listing: null });

      const repo = new PrismaListingLookupRepository(prisma as any);
      await expect(repo.findUrl('product-1', 'seller-x')).resolves.toBeNull();
    });
  });

  describe('findUrlByPlatform', () => {
    it('resolves a platform name to a seller, then to the real listing URL', async () => {
      const prisma = fakePrisma({
        seller: { id: 'seller-1' },
        listing: { productUrl: 'https://real.example/p' },
      });

      const repo = new PrismaListingLookupRepository(prisma as any);
      await expect(repo.findUrlByPlatform('product-1', 'Amazon')).resolves.toBe(
        'https://real.example/p',
      );
    });

    it('returns null when the platform does not resolve to any known seller', async () => {
      const prisma = fakePrisma({ seller: null });

      const repo = new PrismaListingLookupRepository(prisma as any);
      await expect(repo.findUrlByPlatform('product-1', 'NotAStore')).resolves.toBeNull();
    });

    it('returns null when the seller is real but has no listing for this product', async () => {
      const prisma = fakePrisma({ seller: { id: 'seller-1' }, listing: null });

      const repo = new PrismaListingLookupRepository(prisma as any);
      await expect(repo.findUrlByPlatform('product-1', 'Amazon')).resolves.toBeNull();
    });
  });
});
