import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  CachedCompareByProduct,
  CompareCacheRepository,
} from '../../domain/repositories/compare-cache.repository';
import { ProviderComparison } from '../../../../shared/interfaces/product-provider.interface';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';

/** Prisma implementation of the compare cache (table: `compare_cache`), keyed by token. */
@Injectable()
export class CompareCachePrismaRepository extends CompareCacheRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {
    super();
  }

  /**
   * Fresh comparison for this token, or null if missing/stale. Freshness is
   * checked against the CURRENT compare_cache_hours (Supabase) using the row's
   * updatedAt — NOT the stored expiresAt. This way, changing the dial takes
   * effect immediately for ALL rows: set it to 0 and every tap refreshes, even
   * rows saved earlier under a longer window. Falls back to 24h if unset.
   */
  async findFreshByToken(token: string): Promise<ProviderComparison | null> {
    if (!token) return null;
    const row = await this.prisma.compareCache.findUnique({ where: { token } });
    if (!row) return null;

    const hours = await this.runtimeConfig.getCompareCacheHours();
    const windowMs = hours * 60 * 60 * 1000;
    const ageMs = Date.now() - row.updatedAt.getTime();
    if (ageMs >= windowMs) return null; // stale under the CURRENT window -> refresh

    // The stored `results` JSON was serialized BEFORE the fresh-fetch path
    // stamps `internalProductId` onto it (see GetComparisonUseCase.fetchAndStore),
    // so it's never in there — re-attach it here from the row's own `productId`
    // column, or every cache-hit silently loses the internal id (breaking
    // Set Alert, Similar products, and variant siblings on any repeat view).
    return {
      ...(row.results as unknown as ProviderComparison),
      internalProductId: row.productId,
    } as ProviderComparison & { internalProductId: string | null };
  }

  /**
   * Latest cached comparison for a productId (newest updatedAt), regardless of
   * age. Returns token + capturedAt + fresh flag. Used by the notification-tap
   * flow: fresh -> serve as-is; stale -> refresh using the token.
   */
  async findLatestByProduct(productId: string): Promise<CachedCompareByProduct | null> {
    if (!productId) return null;
    const row = await this.prisma.compareCache.findFirst({
      where: { productId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!row) return null;

    const hours = await this.runtimeConfig.getCompareCacheHours();
    const windowMs = hours * 60 * 60 * 1000;
    const ageMs = Date.now() - row.updatedAt.getTime();

    return {
      results: row.results as unknown as ProviderComparison,
      token: row.token ?? null,
      capturedAt: row.updatedAt,
      fresh: ageMs < windowMs,
    };
  }

  /** Upsert keyed by token; productId kept for the catalog relation. */
  async upsertByToken(input: {
    token: string;
    productId: string | null;
    results: ProviderComparison | { sellers: [] };
    sellerCount: number;
    lowestPrice: number | null;
  }): Promise<void> {
    // Expiry window from Supabase (app_config.compare_cache_hours), in HOURS.
    // 0 = expires immediately = always refresh. Falls back to 24 if unset.
    const hours = await this.runtimeConfig.getCompareCacheHours();
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const results = input.results as unknown as Prisma.InputJsonValue;

    await this.prisma.compareCache.upsert({
      where: { token: input.token },
      create: {
        token: input.token,
        productId: input.productId,
        results,
        sellerCount: input.sellerCount,
        lowestPrice: input.lowestPrice,
        expiresAt,
      },
      update: {
        productId: input.productId,
        results,
        sellerCount: input.sellerCount,
        lowestPrice: input.lowestPrice,
        expiresAt,
      },
    });
  }
}
