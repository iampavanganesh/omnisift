import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  TrendingRepository,
  MostSearchedResult,
} from '../../domain/repositories/trending.repository';
import { toProductRow } from '../../../products/infrastructure/repositories/catalog-detail.helpers';
import { CatalogProductRow } from '../../../products/domain/repositories/catalog-detail.types';
import { ProviderProduct } from '../../../../shared/interfaces/product-provider.interface';
import { normalizeQuery } from '../../../../shared/utils/normalize';
import { categorize } from '../../../../shared/utils/catalog-clean';

@Injectable()
export class PrismaTrendingRepository implements TrendingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * V1 proxy for "trending": newest catalog products. Once product-level view
   * or click counts exist, replace this ordering with a real popularity signal
   * — the return shape (CatalogProductRow) won't need to change.
   */
  async listTrending(limit: number): Promise<CatalogProductRow[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { listings: { include: { price: true } } },
    });
    return products.map(toProductRow);
  }

  /**
   * Real "most searched" signal, not a proxy: every fresh search writes an
   * `analytics_events` row (eventName='search', properties.query = raw text),
   * and search_cache holds the actual cached result set for every normalized
   * query, ranked by `position`. So: rank queries searched in the last `hours`
   * hours by frequency, then for each take its top-ranked cached product,
   * deduped across queries. No fabricated data — entirely derived from real
   * logged searches and real cached results. `searchCount` on each result is
   * the real, un-inflated count for that query — never rounded up for effect.
   */
  async listMostSearched(hours: number, limit: number): Promise<MostSearchedResult[]> {
    const ranked = await this.rankedQueries(hours);
    const results: MostSearchedResult[] = [];
    const seen = new Set<string>();
    for (const [nq, count] of ranked) {
      if (results.length >= limit) break;
      const row = await this.prisma.searchCache.findFirst({
        where: { normalizedQuery: nq, available: true },
        orderBy: { position: 'asc' },
      });
      if (!row) continue;
      const product = row.data as unknown as ProviderProduct;
      if (!product.productId || seen.has(product.productId)) continue;
      seen.add(product.productId);
      results.push({ product, searchCount: count });
    }
    return results;
  }

  /**
   * Same ranking, filtered to one category — real per-product categorization
   * (the same `categorize()` search results are tagged with), not a new
   * signal. A query only counts toward this category if its top cached
   * product actually categorizes into it.
   */
  async listMostSearchedInCategory(
    categorySlug: string,
    hours: number,
    limit: number,
  ): Promise<MostSearchedResult[] | null> {
    const category = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return null;

    const ranked = await this.rankedQueries(hours);
    const results: MostSearchedResult[] = [];
    const seen = new Set<string>();
    for (const [nq, count] of ranked) {
      if (results.length >= limit) break;
      const row = await this.prisma.searchCache.findFirst({
        where: { normalizedQuery: nq, available: true },
        orderBy: { position: 'asc' },
      });
      if (!row) continue;
      const product = row.data as unknown as ProviderProduct;
      if (!product.productId || seen.has(product.productId)) continue;
      if (categorize(product.title) !== category.name) continue;
      seen.add(product.productId);
      results.push({ product, searchCount: count });
    }
    return results;
  }

  /** Queries searched in the last `hours` hours, ranked by real frequency (raw
   * query text merged onto its normalized form — analytics.track() stores the
   * raw text, not normalized). */
  private async rankedQueries(hours: number): Promise<[string, number][]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Raw SQL: Prisma's groupBy can't group on a JSON field. Columns are
    // camelCase and were created quoted (see migration 20260812111930_init),
    // so they must be double-quoted here.
    const rows = await this.prisma.$queryRaw<{ query: string; cnt: bigint }[]>`
      SELECT properties->>'query' AS query, COUNT(*)::bigint AS cnt
      FROM analytics_events
      WHERE "eventName" = 'search'
        AND "createdAt" >= ${since}
        AND properties->>'query' IS NOT NULL
      GROUP BY properties->>'query'
      ORDER BY cnt DESC
      LIMIT 200
    `;

    const counts = new Map<string, number>();
    for (const r of rows) {
      const nq = normalizeQuery(r.query);
      if (!nq) continue;
      counts.set(nq, (counts.get(nq) ?? 0) + Number(r.cnt));
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }
}
