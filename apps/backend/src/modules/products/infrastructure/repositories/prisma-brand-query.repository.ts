import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  BrandDetail,
  BrandQueryRepository,
  BrandWithCount,
} from '../../domain/repositories/brand-query.repository';
import { CatalogDetailQuery } from '../../domain/repositories/catalog-detail.types';
import {
  applyPriceFilter,
  computeInsights,
  sortAndPage,
  toProductRow,
  NO_MATCH_ID,
} from './catalog-detail.helpers';

@Injectable()
export class PrismaBrandQueryRepository implements BrandQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listWithCounts(): Promise<BrandWithCount[]> {
    const rows = await this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      productCount: r._count.products,
      logoUrl: r.logoUrl,
      description: r.description,
    }));
  }

  async getDetail(slug: string, query: CatalogDetailQuery): Promise<BrandDetail | null> {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) return null;

    // If the ?category= slug given doesn't resolve, NO_MATCH_ID deliberately yields
    // zero products rather than silently falling back to the brand's full catalog.
    const categoryId = query.category
      ? ((await this.prisma.category.findUnique({ where: { slug: query.category } }))?.id ??
        NO_MATCH_ID)
      : undefined;

    // `query.brands` (multi-select) is a category-page-only facet — a brand's own
    // page is already scoped to this one brand, so it's deliberately unused here.
    const products = await this.prisma.product.findMany({
      where: {
        brandId: brand.id,
        ...(categoryId ? { categoryId } : {}),
        ...(query.minRating != null ? { rating: { gte: query.minRating } } : {}),
      },
      include: { listings: { include: { price: true } } },
      orderBy: query.sort === 'newest' ? { createdAt: 'desc' } : undefined,
    });
    const rows = applyPriceFilter(products.map(toProductRow), query.minPrice, query.maxPrice);
    const { paged, hasMore } = sortAndPage(rows, query.sort, query.page, query.pageSize);

    const categoryGroups = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { brandId: brand.id, categoryId: { not: null } },
      _count: { _all: true },
    });
    const categoryIds = categoryGroups
      .map((g) => g.categoryId)
      .filter((id): id is string => id != null);
    // 'Uncategorized' is an internal fallback bucket, never shown as a browsable
    // category anywhere in the app — exclude it from this cross-reference too.
    const categories = categoryIds.length
      ? await this.prisma.category.findMany({
          where: { id: { in: categoryIds }, name: { not: 'Uncategorized' } },
        })
      : [];
    const categoriesForBrand = categoryGroups
      .map((g) => {
        const c = categories.find((x) => x.id === g.categoryId);
        return c ? { id: c.id, name: c.name, slug: c.slug, productCount: g._count._all } : null;
      })
      .filter((c): c is NonNullable<typeof c> => c != null)
      .sort((a, b) => b.productCount - a.productCount);

    const sellerGroups = await this.prisma.productListing.groupBy({
      by: ['sellerId'],
      where: { product: { brandId: brand.id } },
      _count: { _all: true },
    });
    const sellerIds = sellerGroups.map((g) => g.sellerId);
    const sellers = sellerIds.length
      ? await this.prisma.seller.findMany({ where: { id: { in: sellerIds } } })
      : [];
    const sellersForBrand = sellerGroups
      .map((g) => {
        const s = sellers.find((x) => x.id === g.sellerId);
        return s ? { id: s.id, name: s.name, productCount: g._count._all } : null;
      })
      .filter((s): s is NonNullable<typeof s> => s != null)
      .sort((a, b) => b.productCount - a.productCount);

    return {
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        description: brand.description,
      },
      insights: computeInsights(rows),
      categoriesForBrand,
      sellersForBrand,
      products: paged,
      hasMore,
    };
  }
}
