import { describe, expect, it, vi } from 'vitest';
import { RuntimeConfigService } from '../../src/core/config/runtime-config.service';
import { PrismaService } from '../../src/core/database/prisma.service';
import { ALERTS, CACHE_TTL, PAGINATION } from '../../src/shared/constants';

/**
 * This service is the runtime dial switchboard (Supabase `app_config`). Its
 * contract, stated in its own doc comment, is that config TUNES behavior and
 * never BREAKS the app: every getter must fall back to a safe hardcoded
 * default when the row is missing, unparseable, or the database is
 * unreachable. Nothing tested that before; these pin it.
 */
function fakePrisma(rows: { key: string; value: string }[] | Error) {
  const findMany = vi.fn(async () => {
    if (rows instanceof Error) throw rows;
    return rows;
  });
  return {
    prisma: { appConfig: { findMany } } as unknown as PrismaService,
    findMany,
  };
}

describe('RuntimeConfigService', () => {
  describe('reads real configured values', () => {
    it('returns the configured value for each dial', async () => {
      const { prisma } = fakePrisma([
        { key: 'max_api_calls', value: '7' },
        { key: 'search_cache_days', value: '3' },
        { key: 'compare_cache_hours', value: '12' },
        { key: 'wishlist_max_items', value: '50' },
        { key: 'price_graph_enabled', value: 'true' },
        { key: 'alert_refresh_batch_cap', value: '5' },
      ]);
      const config = new RuntimeConfigService(prisma);

      await expect(config.getMaxApiCalls()).resolves.toBe(7);
      await expect(config.getSearchCacheDays()).resolves.toBe(3);
      await expect(config.getCompareCacheHours()).resolves.toBe(12);
      await expect(config.getWishlistMaxItems()).resolves.toBe(50);
      await expect(config.getPriceGraphEnabled()).resolves.toBe(true);
      await expect(config.getAlertRefreshBatchCap()).resolves.toBe(5);
    });

    it('trims stray whitespace/newlines in both key and value (hand-typed Supabase cells)', async () => {
      const { prisma } = fakePrisma([{ key: 'compare_cache_hours\n', value: ' 6 \n' }]);
      const config = new RuntimeConfigService(prisma);
      await expect(config.getCompareCacheHours()).resolves.toBe(6);
    });
  });

  describe('falls back safely', () => {
    it('uses defaults when no rows exist at all', async () => {
      const { prisma } = fakePrisma([]);
      const config = new RuntimeConfigService(prisma);

      await expect(config.getMaxApiCalls()).resolves.toBe(PAGINATION.MAX_PAGES);
      await expect(config.getSearchCacheDays()).resolves.toBe(CACHE_TTL.SEARCH_DAYS);
      await expect(config.getCompareCacheHours()).resolves.toBe(CACHE_TTL.COMPARE_HOURS);
      await expect(config.getAlertRefreshBatchCap()).resolves.toBe(ALERTS.REFRESH_BATCH_CAP);
      await expect(config.getPriceGraphEnabled()).resolves.toBe(false); // off unless explicitly "true"
    });

    it('uses defaults when the stored value is unparseable', async () => {
      const { prisma } = fakePrisma([
        { key: 'max_api_calls', value: 'not-a-number' },
        { key: 'alert_refresh_batch_cap', value: 'abc' },
      ]);
      const config = new RuntimeConfigService(prisma);

      await expect(config.getMaxApiCalls()).resolves.toBe(PAGINATION.MAX_PAGES);
      await expect(config.getAlertRefreshBatchCap()).resolves.toBe(ALERTS.REFRESH_BATCH_CAP);
    });

    it('never throws when the database is unreachable — falls back instead', async () => {
      const { prisma } = fakePrisma(new Error('connection refused'));
      const config = new RuntimeConfigService(prisma);

      await expect(config.getSearchCacheDays()).resolves.toBe(CACHE_TTL.SEARCH_DAYS);
      await expect(config.getCompareCacheHours()).resolves.toBe(CACHE_TTL.COMPARE_HOURS);
      await expect(config.getAlertRefreshBatchCap()).resolves.toBe(ALERTS.REFRESH_BATCH_CAP);
    });

    it('rejects a batch cap below 1 (a 0 cap would silently disable the alert refresh)', async () => {
      const { prisma } = fakePrisma([{ key: 'alert_refresh_batch_cap', value: '0' }]);
      const config = new RuntimeConfigService(prisma);
      await expect(config.getAlertRefreshBatchCap()).resolves.toBe(ALERTS.REFRESH_BATCH_CAP);
    });
  });

  describe('freshness dials specifically allow 0', () => {
    it('honours 0 for the cache windows (0 = always refresh, a real operational setting)', async () => {
      const { prisma } = fakePrisma([
        { key: 'search_cache_days', value: '0' },
        { key: 'compare_cache_hours', value: '0' },
      ]);
      const config = new RuntimeConfigService(prisma);

      await expect(config.getSearchCacheDays()).resolves.toBe(0);
      await expect(config.getCompareCacheHours()).resolves.toBe(0);
    });
  });

  it('caches the snapshot rather than hitting Postgres on every read', async () => {
    const { prisma, findMany } = fakePrisma([{ key: 'max_api_calls', value: '2' }]);
    const config = new RuntimeConfigService(prisma);

    await config.getMaxApiCalls();
    await config.getMaxApiCalls();
    await config.getCompareCacheHours();

    expect(findMany).toHaveBeenCalledOnce();
  });
});
