import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  CategoryDetail,
  CategoryFacet,
  CategoryQueryRepository,
  CategoryWithCount,
} from '../../domain/repositories/category-query.repository';
import { CatalogDetailQuery } from '../../domain/repositories/catalog-detail.types';
import {
  applyPriceFilter,
  applySpecsFilter,
  computeInsights,
  sortAndPage,
  splitSpecValue,
  toProductRow,
  NO_MATCH_ID,
} from './catalog-detail.helpers';

/** A key needs at least this many products carrying it, and at least this
 * many distinct real values, to be worth showing as a filter — a key with
 * one product or one repeated value can't actually narrow anything. */
const MIN_FACET_PRODUCTS = 2;
const MIN_FACET_VALUES = 2;
const MAX_FACET_KEYS = 6;
const MAX_FACET_VALUES = 10;

@Injectable()
export class PrismaCategoryQueryRepository implements CategoryQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listWithCounts(): Promise<CategoryWithCount[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      productCount: r._count.products,
    }));
  }

  async getDetail(slug: string, query: CatalogDetailQuery): Promise<CategoryDetail | null> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) return null;

    // See PrismaBrandQueryRepository.getDetail for why an unresolved ?brand= slug
    // yields zero products instead of the category's full unfiltered catalog.
    const brandId = query.brand
      ? ((await this.prisma.brand.findUnique({ where: { slug: query.brand } }))?.id ?? NO_MATCH_ID)
      : undefined;

    // Multi-select brand facet from the filter sheet — same NO_MATCH_ID sentinel
    // rule: an unresolved slug filters to zero rather than silently ignoring it.
    const facetBrandIds = query.brands?.length
      ? await this.prisma.brand
          .findMany({ where: { slug: { in: query.brands } }, select: { id: true } })
          .then((rows) => (rows.length ? rows.map((r) => r.id) : [NO_MATCH_ID]))
      : undefined;

    const products = await this.prisma.product.findMany({
      where: {
        categoryId: category.id,
        ...(brandId ? { brandId } : {}),
        ...(facetBrandIds ? { brandId: { in: facetBrandIds } } : {}),
        ...(query.minRating != null ? { rating: { gte: query.minRating } } : {}),
      },
      include: { listings: { include: { price: true } } },
      orderBy: query.sort === 'newest' ? { createdAt: 'desc' } : undefined,
    });
    const specFiltered = applySpecsFilter(products, query.specs);
    const rows = applyPriceFilter(specFiltered.map(toProductRow), query.minPrice, query.maxPrice);
    const { paged, hasMore } = sortAndPage(rows, query.sort, query.page, query.pageSize);

    const brandGroups = await this.prisma.product.groupBy({
      by: ['brandId'],
      where: { categoryId: category.id, brandId: { not: null } },
      _count: { _all: true },
    });
    const brandIds = brandGroups.map((g) => g.brandId).filter((id): id is string => id != null);
    const brands = brandIds.length
      ? await this.prisma.brand.findMany({ where: { id: { in: brandIds } } })
      : [];
    const brandsInCategory = brandGroups
      .map((g) => {
        const b = brands.find((x) => x.id === g.brandId);
        return b
          ? {
              id: b.id,
              name: b.name,
              slug: b.slug,
              productCount: g._count._all,
              logoUrl: b.logoUrl,
            }
          : null;
      })
      .filter((b): b is NonNullable<typeof b> => b != null)
      .sort((a, b) => b.productCount - a.productCount);

    // Same set computeInsights draws topDiscountPct from — the single row that
    // earned it, or null if nothing in this category has a discount at all.
    const topDeal = rows.reduce<(typeof rows)[number] | null>(
      (best, r) => (r.discountPct != null && r.discountPct > (best?.discountPct ?? -1) ? r : best),
      null,
    );

    return {
      category: { id: category.id, name: category.name, slug: category.slug },
      insights: computeInsights(rows),
      brandsInCategory,
      topDeal,
      products: paged,
      hasMore,
    };
  }

  /**
   * Real, data-driven filter facets — whatever spec keys actually repeat with
   * multiple distinct values across this category's real products, right now.
   * No hardcoded per-category taxonomy: a thin category with 1-2 products
   * simply returns an empty list until it has enough real data to filter on.
   */
  async getFacets(slug: string): Promise<CategoryFacet[] | null> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) return null;

    const products = await this.prisma.product.findMany({
      where: { categoryId: category.id },
      select: { specs: true },
    });

    // key -> value -> product count. Some scraped values are really a
    // comma-packed list (e.g. "Colour": "Blue, Silver, Mint") — splitSpecValue
    // tokenizes each into its own real, selectable value (applySpecsFilter
    // uses the same tokenization, so a chip always matches what earned it).
    const tally = new Map<string, Map<string, number>>();
    const keyProductCount = new Map<string, number>();
    for (const p of products) {
      const specs = (p.specs as Record<string, string> | null) ?? {};
      for (const [key, rawValue] of Object.entries(specs)) {
        if (!rawValue) continue;
        const tokens = new Set(splitSpecValue(rawValue));
        if (tokens.size === 0) continue;
        keyProductCount.set(key, (keyProductCount.get(key) ?? 0) + 1);
        const values = tally.get(key) ?? new Map<string, number>();
        for (const token of tokens) {
          values.set(token, (values.get(token) ?? 0) + 1);
        }
        tally.set(key, values);
      }
    }

    const candidates: (CategoryFacet & { productsWithKey: number })[] = [];
    for (const [key, values] of tally.entries()) {
      const productsWithKey = keyProductCount.get(key) ?? 0;
      if (productsWithKey < MIN_FACET_PRODUCTS || values.size < MIN_FACET_VALUES) continue;
      const sortedValues = [...values.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_FACET_VALUES)
        .map(([value, count]) => ({ value, count }));
      candidates.push({ key, values: sortedValues, productsWithKey });
    }

    return candidates
      .sort((a, b) => b.productsWithKey - a.productsWithKey)
      .slice(0, MAX_FACET_KEYS)
      .map(({ key, values }) => ({ key, values }));
  }
}
