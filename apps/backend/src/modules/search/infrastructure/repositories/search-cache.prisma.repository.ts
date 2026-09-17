import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { SearchCacheRepository } from '../../domain/repositories/search-cache.repository';
import { ProviderProduct } from '../../../../shared/interfaces/product-provider.interface';
import { CACHE_TTL } from '../../../../shared/constants';
import { AppEvents, ProductPriceObservedPayload } from '../../../../core/events/app-events';

/** Provider key for SerpAPI/Google external ids. */
const SERPAPI_PROVIDER = 'serpapi';

/**
 * Prisma implementation of the search store (table: `search_cache`, ROWS model).
 * One row per (normalizedQuery, productId). A query is "fresh" if any of its
 * rows were refreshed within CACHE_TTL.SEARCH_DAYS; otherwise it is re-fetched.
 */
@Injectable()
export class SearchCachePrismaRepository extends SearchCacheRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2, // ← NEW: emit price observations for alerts
  ) {
    super();
  }

  /** Cutoff Date for the freshness window (now - SEARCH_DAYS). */
  private freshnessCutoff(): Date {
    return new Date(Date.now() - CACHE_TTL.SEARCH_DAYS * 24 * 60 * 60 * 1000);
  }

  async getFreshRows(normalizedQuery: string): Promise<ProviderProduct[] | null> {
    const cutoff = this.freshnessCutoff();
    // A query is fresh if its most recent refresh is within the window.
    const newest = await this.prisma.searchCache.findFirst({
      where: { normalizedQuery },
      orderBy: { refreshedAt: 'desc' },
      select: { refreshedAt: true },
    });
    if (!newest || newest.refreshedAt <= cutoff) return null; // stale or empty

    const rows = await this.prisma.searchCache.findMany({
      where: { normalizedQuery, available: true },
      orderBy: [{ position: 'asc' }, { refreshedAt: 'desc' }],
    });
    if (rows.length === 0) return null;
    return rows.map((r) => this.decode(r.data));
  }

  async getAllRows(normalizedQuery: string): Promise<ProviderProduct[] | null> {
    const rows = await this.prisma.searchCache.findMany({
      where: { normalizedQuery, available: true },
      orderBy: [{ position: 'asc' }, { refreshedAt: 'desc' }],
    });
    if (rows.length === 0) return null;
    return rows.map((r) => this.decode(r.data));
  }

  /** Newest refreshedAt for this query (freshness check), or null if no rows. */
  async getNewestRefreshedAt(normalizedQuery: string): Promise<Date | null> {
    const newest = await this.prisma.searchCache.findFirst({
      where: { normalizedQuery },
      orderBy: { refreshedAt: 'desc' },
      select: { refreshedAt: true },
    });
    return newest?.refreshedAt ?? null;
  }

  async refreshFromProvider(input: {
    normalizedQuery: string;
    rawQuery: string;
    products: ProviderProduct[];
    startPosition: number;
  }): Promise<void> {
    const now = new Date();
    const { normalizedQuery, rawQuery, products, startPosition } = input;

    // Upsert each product. Existing (same query+productId) -> UPDATE (fresh wins);
    // new -> INSERT. Position keeps provider/Google order across pages.
    // Skip products with no productId (can't dedup them safely).
    const writable = products.filter((p) => p.productId && p.productId.trim() !== '');

    const ops = writable.map((p, i) => {
      const data = p as unknown as Prisma.InputJsonValue;
      const position = startPosition + i;
      return this.prisma.searchCache.upsert({
        where: {
          normalizedQuery_productId: { normalizedQuery, productId: p.productId },
        },
        create: {
          normalizedQuery,
          productId: p.productId,
          rawQuery,
          data,
          position,
          available: true,
          refreshedAt: now,
          firstSeenAt: now,
          lastSeenAt: now,
        },
        update: {
          rawQuery,
          data, // fresh wins — a real search sets the new baseline price
          // position intentionally NOT updated — first-seen position wins so a
          // product that appeared on page 0 (e.g. Pixel 8 on "google pixe")
          // stays there and can't resurface in a later page's slice = no dupes.
          available: true,
          refreshedAt: now,
          lastSeenAt: now,
        },
      });
    });

    if (ops.length > 0) {
      // Batch the upserts in one transaction for consistency + speed.
      await this.prisma.$transaction(ops);

      // NEW: announce each trusted product's current price so the alert checker
      // can evaluate it. Carries the Google id (externalId); the listener resolves
      // it to an internal product id. Only runs on a FRESH search (this method
      // isn't called on cache hits), so it never double-fires with compare.
      this.emitObservations(writable);
    }
  }

  /** Fire ProductPriceObserved (source=search) for every product with a price. */
  private emitObservations(products: ProviderProduct[]): void {
    let emitted = 0;
    for (const p of products) {
      const price = typeof p.price === 'number' ? p.price : null;
      if (price == null || price <= 0) continue;
      const payload: ProductPriceObservedPayload = {
        externalId: p.productId,
        provider: SERPAPI_PROVIDER,
        price,
        source: 'search',
      };
      this.events.emit(AppEvents.ProductPriceObserved, payload);
      emitted++;
    }
    if (emitted > 0) {
      console.log(`🔔 PRICE OBSERVED (search) | ${emitted} products`);
    }
  }

  /**
   * Heal price/rating/reviews across every search row holding this productId,
   * after a compare fetch. CHEAPEST WINS: only lowers the search price if compare
   * found a cheaper one — never raises it here. A genuine price increase comes in
   * via the 7-day search refresh (refreshFromProvider, fresh wins), which resets
   * the baseline. Rating/reviews always take the fresher value. Zero extra API.
   */
  async syncFromCompare(
    productId: string,
    fresh: { price: number | null; rating: number | null; reviewCount: number | null },
  ): Promise<void> {
    if (!productId) return;
    const rows = await this.prisma.searchCache.findMany({ where: { productId } });

    // CASE 1 — product has NO search_cache row yet (never searched, or the row
    // was cleared). A compare tap is a real price check, so create a row under a
    // synthetic query so search/wishlist can read it. refreshedAt is set OLD
    // (epoch) on purpose: this is NOT a real search, so it must never satisfy the
    // freshness gate — a genuine search will still fire and overwrite it (A:
    // freshest wins).
    if (rows.length === 0) {
      if (fresh.price == null || fresh.price <= 0) return;
      const compareData: Record<string, unknown> = {
        productId,
        price: fresh.price,
        extractedPrice: fresh.price,
        rating: fresh.rating ?? null,
        reviewCount: fresh.reviewCount ?? null,
      };
      await this.prisma.searchCache.upsert({
        where: {
          normalizedQuery_productId: { normalizedQuery: '__compare__', productId },
        },
        create: {
          normalizedQuery: '__compare__',
          productId,
          rawQuery: '__compare__',
          data: compareData as Prisma.InputJsonValue,
          position: 0,
          available: true,
          refreshedAt: new Date(0), // epoch → never "fresh", real search overrides
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
        update: {
          data: compareData as Prisma.InputJsonValue,
          lastSeenAt: new Date(),
        },
      });
      return;
    }

    // CASE 2 — rows exist. Write compare's price whether it's HIGHER or LOWER
    // (A: the latest real check wins), plus fresher rating/reviews.
    const ops = [];
    for (const row of rows) {
      const data = { ...(row.data as Record<string, unknown>) };

      let changed = false;
      if (fresh.price != null && fresh.price > 0 && data.price !== fresh.price) {
        data.price = fresh.price;
        data.extractedPrice = fresh.price;
        changed = true;
      }
      if (fresh.rating != null && data.rating !== fresh.rating) {
        data.rating = fresh.rating;
        changed = true;
      }
      if (fresh.reviewCount != null && data.reviewCount !== fresh.reviewCount) {
        data.reviewCount = fresh.reviewCount;
        changed = true;
      }

      if (changed) {
        // Do NOT bump refreshedAt — that tracks the last real provider search.
        ops.push(
          this.prisma.searchCache.update({
            where: { id: row.id },
            data: { data: data as Prisma.InputJsonValue },
          }),
        );
      }
    }
    if (ops.length > 0) await this.prisma.$transaction(ops);
  }

  /** Current price per productId, from the freshest search_cache row each. */
  async getCurrentPrices(productIds: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (productIds.length === 0) return out;

    const rows = await this.prisma.searchCache.findMany({
      where: { productId: { in: productIds } },
      orderBy: { refreshedAt: 'desc' }, // freshest first
    });
    // First (freshest) row per productId wins.
    for (const row of rows) {
      if (out.has(row.productId)) continue;
      const data = row.data as Record<string, unknown>;
      const price = typeof data.price === 'number' ? data.price : null;
      if (price != null && price > 0) out.set(row.productId, price);
    }
    return out;
  }
  private decode(data: unknown): ProviderProduct {
    return data as ProviderProduct;
  }
}
