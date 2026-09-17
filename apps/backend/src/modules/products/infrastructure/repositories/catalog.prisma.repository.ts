import { Injectable } from '@nestjs/common';
import { Availability, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  CatalogRepository,
  PersistedComparison,
} from '../../domain/repositories/catalog.repository';
import {
  ProviderComparison,
  ProviderSeller,
} from '../../../../shared/interfaces/product-provider.interface';
import { PriceObservation } from '../../../../core/events/app-events';
import { DatabaseError } from '../../../../core/errors/app-error';
import { normalizeQuery, slugify, dedupKey, uniqueSlug } from '../../../../shared/utils/normalize';
import { categorize, cleanText, resolveBrand } from '../../../../shared/utils/catalog-clean';

const SERPAPI_SLUG = 'serpapi';
const TX_TIMEOUT_MS = 15_000;

/**
 * Prisma implementation of the canonical-catalog persistence port.
 * Everything for one comparison is written in a single transaction so a
 * partial catalog is never observable.
 */
@Injectable()
export class CatalogPrismaRepository extends CatalogRepository {
  private providerIdCache: string | undefined;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async persistComparison(comparison: ProviderComparison): Promise<PersistedComparison> {
    const providerId = await this.resolveProviderId();
    const observedAt = new Date();

    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const productId = await this.upsertProduct(tx, comparison);
        const observations: PriceObservation[] = [];

        for (const seller of comparison.sellers) {
          const sellerId = await this.upsertSeller(tx, seller);
          const listingId = await this.upsertListing(tx, {
            productId,
            sellerId,
            providerId,
            seller,
          });
          await this.upsertCurrentPrice(tx, listingId, seller, observedAt);
          observations.push({
            listingId,
            providerId,
            price: seller.price,
            mrp: seller.mrp,
            currency: seller.currency,
            availability: Availability.UNKNOWN,
            discountPct: seller.discountPct,
            sellerId, // the seller this price came from (already resolved above)
          });
          await this.recordSellerSnapshot(tx, productId, sellerId, seller, observedAt);
        }

        return { productId, observations };
      },
      { timeout: TX_TIMEOUT_MS },
    );
  }

  /** One daily price row per seller per product (powers per-platform graphs). */
  private async recordSellerSnapshot(
    tx: Prisma.TransactionClient,
    productId: string,
    sellerId: string,
    seller: ProviderSeller,
    observedAt: Date,
  ): Promise<void> {
    const startOfDay = new Date(observedAt);
    startOfDay.setHours(0, 0, 0, 0);
    const existing = await tx.sellerPriceSnapshot.findFirst({
      where: { productId, sellerId, capturedAt: { gte: startOfDay } },
      select: { id: true },
    });
    if (existing) return; // already captured this seller today
    await tx.sellerPriceSnapshot.create({
      data: {
        productId,
        sellerId,
        price: seller.price,
        mrp: seller.mrp ?? null,
        discountPct: seller.discountPct ?? null,
        availability: Availability.UNKNOWN,
      },
    });
  }

  /** Resolve/create the canonical Product (dedup by dedupKey) + Brand + Category. */
  private async upsertProduct(
    tx: Prisma.TransactionClient,
    comparison: ProviderComparison,
  ): Promise<string> {
    // Clean the title first (repairs mojibake like "à¤•à¥‡").
    const cleanTitle = cleanText(comparison.title) || 'Unknown Product';
    // normalizedTitle stays for display/search; dedup uses the stronger key.
    const normalizedTitle = normalizeQuery(cleanTitle);
    const dedup = dedupKey(cleanTitle);

    // Brand: only a real provider/spec signal — never guessed from the title
    // (that produced junk catalog entries; see resolveBrand's guessFromTitle).
    const brandName = resolveBrand(comparison.brand, cleanTitle, false);
    const brandId = await this.upsertBrand(tx, brandName);

    // Category: keyword rules → Mobiles/Footwear/… or Uncategorized.
    const categoryId = await this.upsertCategory(tx, categorize(cleanTitle));

    const primaryImageUrl = comparison.images[0] ?? null;
    const images = comparison.images as unknown as Prisma.InputJsonValue;
    const specs = this.encodeSpecs(comparison.specifications);
    // Reviews/rating only ever come from a live comparison fetch (never search
    // results) — capture them here so the DB-only product page (apps/web) can show
    // real reviews without apps/web ever calling the provider itself.
    const ratingBreakdown =
      comparison.ratingBreakdown.length > 0
        ? (comparison.ratingBreakdown as unknown as Prisma.InputJsonValue)
        : null;
    const reviews =
      comparison.userReviews.length > 0
        ? (comparison.userReviews as unknown as Prisma.InputJsonValue)
        : null;

    // Dedup by the stronger key: match any existing product whose normalizedTitle
    // reduces to the same dedupKey. (normalizedTitle is stored; we compare keys.)
    const candidates = await tx.product.findMany({
      where: { normalizedTitle: { contains: dedup.split(' ')[0] } },
      select: {
        id: true,
        normalizedTitle: true,
        brandId: true,
        categoryId: true,
        primaryImageUrl: true,
      },
    });
    const existing = candidates.find((c) => dedupKey(c.normalizedTitle) === dedup);

    if (existing) {
      await tx.product.update({
        where: { id: existing.id },
        data: {
          title: cleanTitle,
          brandId: brandId ?? existing.brandId,
          categoryId: categoryId ?? existing.categoryId,
          primaryImageUrl: primaryImageUrl ?? existing.primaryImageUrl,
          ...(comparison.images.length > 0 ? { images } : {}),
          ...(specs ? { specs } : {}),
          rating: comparison.rating ?? undefined,
          reviewCount: comparison.reviewCount ?? undefined,
          ...(ratingBreakdown ? { ratingBreakdown } : {}),
          ...(reviews ? { reviews } : {}),
        },
      });
      return existing.id;
    }

    const slug = await uniqueSlug(cleanTitle, async (candidate) => {
      const existing = await tx.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return existing !== null;
    });

    const created = await tx.product.create({
      data: {
        title: cleanTitle,
        normalizedTitle,
        slug,
        brandId,
        categoryId,
        primaryImageUrl,
        images,
        ...(specs ? { specs } : {}),
        rating: comparison.rating ?? undefined,
        reviewCount: comparison.reviewCount ?? undefined,
        ...(ratingBreakdown ? { ratingBreakdown } : {}),
        ...(reviews ? { reviews } : {}),
      },
    });
    return created.id;
  }

  /** Resolve/create a Category by name (slug unique). Returns null for empties. */
  private async upsertCategory(
    tx: Prisma.TransactionClient,
    categoryName: string,
  ): Promise<string | null> {
    const name = categoryName?.trim();
    if (!name) return null;
    const slug = slugify(name);
    if (!slug) return null;
    const category = await tx.category.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
    return category.id;
  }

  private async upsertBrand(
    tx: Prisma.TransactionClient,
    brandName: string,
  ): Promise<string | null> {
    const name = cleanText(brandName);
    if (!name) return null;
    const slug = slugify(name);
    if (!slug) return null;
    const brand = await tx.brand.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
    return brand.id;
  }

  private async upsertSeller(
    tx: Prisma.TransactionClient,
    seller: ProviderSeller,
  ): Promise<string> {
    const slug = slugify(seller.platform);
    const row = await tx.seller.upsert({
      where: { slug },
      create: { name: seller.platform, slug, logoUrl: seller.logo || null },
      update: seller.logo ? { logoUrl: seller.logo } : {},
    });
    return row.id;
  }

  /**
   * Provider comparisons carry no per-seller product id (ASIN/FSN), so the
   * (sellerId, sellerProductId) unique key can't be used here. We dedup within
   * our own catalog by (productId, sellerId, providerId) instead.
   */
  private async upsertListing(
    tx: Prisma.TransactionClient,
    args: { productId: string; sellerId: string; providerId: string; seller: ProviderSeller },
  ): Promise<string> {
    const { productId, sellerId, providerId, seller } = args;
    const existing = await tx.productListing.findFirst({
      where: { productId, sellerId, providerId },
    });
    if (existing) {
      await tx.productListing.update({
        where: { id: existing.id },
        data: { productUrl: seller.link, imageUrl: seller.logo || existing.imageUrl },
      });
      return existing.id;
    }
    const created = await tx.productListing.create({
      data: {
        productId,
        sellerId,
        providerId,
        productUrl: seller.link,
        imageUrl: seller.logo || null,
        currency: seller.currency,
      },
    });
    return created.id;
  }

  /** Current price is 1:1 with a listing (mutable, upserted on each refresh). */
  private async upsertCurrentPrice(
    tx: Prisma.TransactionClient,
    listingId: string,
    seller: ProviderSeller,
    observedAt: Date,
  ): Promise<void> {
    await tx.price.upsert({
      where: { listingId },
      create: {
        listingId,
        currentPrice: seller.price,
        mrp: seller.mrp,
        discountPct: seller.discountPct,
        currency: seller.currency,
        availability: Availability.UNKNOWN,
        observedAt,
      },
      update: {
        currentPrice: seller.price,
        mrp: seller.mrp,
        discountPct: seller.discountPct,
        currency: seller.currency,
        availability: Availability.UNKNOWN,
        observedAt,
      },
    });
  }

  private encodeSpecs(specs: { name: string; value: string }[]): Prisma.InputJsonValue | null {
    if (!specs || specs.length === 0) return null;
    const map: Record<string, string> = {};
    for (const s of specs) {
      if (s.name) map[s.name] = s.value;
    }
    return Object.keys(map).length > 0 ? map : null;
  }

  private async resolveProviderId(): Promise<string> {
    if (this.providerIdCache) return this.providerIdCache;
    const provider = await this.prisma.provider.findUnique({ where: { slug: SERPAPI_SLUG } });
    if (!provider) {
      throw new DatabaseError('Catalog is not initialized: seed the SerpAPI provider first.');
    }
    this.providerIdCache = provider.id;
    return provider.id;
  }
}
