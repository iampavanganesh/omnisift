import { describe, expect, it, vi } from 'vitest';
import { PrismaPriceAlertRepository } from '../../src/modules/alerts/infrastructure/repositories/prisma-price-alert.repository';

/**
 * P0.2: the refresh-candidate query must read ONLY from priceAlert(isActive),
 * never from wishlist — a wishlist save alone must never become a refresh
 * trigger (product-owner decision, streamed-percolating-sedgewick.md P0.2).
 */
function fakePrisma(rows: { productId: string }[]) {
  return {
    priceAlert: {
      findMany: vi.fn(async () => rows),
    },
  };
}

describe('PrismaPriceAlertRepository.findDistinctActiveProductIds', () => {
  it('queries priceAlert filtered to isActive, distinct by productId — never touches wishlist', async () => {
    const prisma = fakePrisma([{ productId: 'p1' }, { productId: 'p2' }]);

    const repo = new PrismaPriceAlertRepository(prisma as any);

    const ids = await repo.findDistinctActiveProductIds();

    expect(ids).toEqual(['p1', 'p2']);
    expect(prisma.priceAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        distinct: ['productId'],
      }),
    );
  });

  it('returns an empty list when no active alerts exist', async () => {
    const prisma = fakePrisma([]);

    const repo = new PrismaPriceAlertRepository(prisma as any);

    await expect(repo.findDistinctActiveProductIds()).resolves.toEqual([]);
  });
});
