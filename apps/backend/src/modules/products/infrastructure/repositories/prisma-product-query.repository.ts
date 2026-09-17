import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  ProductDetail,
  ProductDetailSeller,
  ProductQueryRepository,
  ProductRatingBar,
  ProductReview,
} from '../../domain/repositories/product-query.repository';
import { CatalogProductRow, VariantSibling } from '../../domain/repositories/catalog-detail.types';
import { ownSingleValuedSpecs, toProductRow, variantBaseSignature } from './catalog-detail.helpers';

/** Minimum normalized-signature length to trust a cross-listing match — guards
 *  against two unrelated short/generic titles accidentally colliding once
 *  their own attribute values are stripped out. */
const MIN_SIGNATURE_LENGTH = 6;

@Injectable()
export class PrismaProductQueryRepository implements ProductQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBySlug(slug: string): Promise<ProductDetail | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
        listings: { include: { price: true, seller: true } },
      },
    });
    if (!product) return null;

    // Same "UNKNOWN counts as available" rule as catalog-detail.helpers.ts —
    // SerpAPI never gives us a real stock signal, so only an explicit
    // OUT_OF_STOCK (if that ever gets set) excludes a listing.
    const sellers: ProductDetailSeller[] = product.listings
      .filter((l) => l.price != null && l.price.availability !== 'OUT_OF_STOCK')
      .map((l) => ({
        sellerId: l.seller.id,
        sellerName: l.seller.name,
        price: Number(l.price!.currentPrice),
        mrp: l.price!.mrp === null ? null : Number(l.price!.mrp),
        discountPct: l.price!.discountPct,
        currency: l.price!.currency,
      }))
      .sort((a, b) => a.price - b.price);

    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    const specs = (product.specs as Record<string, string> | null) ?? null;
    const ratingBreakdown = Array.isArray(product.ratingBreakdown)
      ? (product.ratingBreakdown as unknown as ProductRatingBar[])
      : [];
    const reviews = Array.isArray(product.reviews)
      ? (product.reviews as unknown as ProductReview[])
      : [];

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand ? { name: product.brand.name, slug: product.brand.slug } : null,
      category: product.category
        ? { name: product.category.name, slug: product.category.slug }
        : null,
      imageUrl: product.primaryImageUrl,
      images,
      specs,
      lowestPrice: sellers.length > 0 ? sellers[0].price : null,
      sellers,
      rating: product.rating,
      reviewCount: product.reviewCount,
      ratingBreakdown,
      reviews,
    };
  }

  async getSimilar(productId: string, limit: number): Promise<CatalogProductRow[] | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, category: { select: { name: true } } },
    });
    if (!product) return null;
    // 'Uncategorized' is an internal fallback bucket, not a real grouping — treat it
    // the same as "no category" rather than surfacing an arbitrary grab-bag of
    // unrelated products as "similar" (same rule apps/web and the Flutter client
    // already follow for category listings).
    if (!product.categoryId || product.category?.name === 'Uncategorized') return [];

    const siblings = await this.prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: productId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { listings: { include: { price: true } } },
    });
    return siblings.map(toProductRow);
  }

  async getVariantSiblings(productId: string): Promise<VariantSibling[] | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { listings: { include: { price: true } } },
    });
    if (!product) return null;
    if (!product.brandId || !product.categoryId) return [];

    const ownValues = ownSingleValuedSpecs(
      (product.specs as Record<string, string> | null) ?? null,
    );
    // No single-valued spec to anchor on (e.g. this listing's page just
    // enumerated every colour/storage option) — no safe way to know which
    // other listing, if any, is really "this same model, different SKU".
    if (ownValues.length === 0) return [];

    const signature = variantBaseSignature(product.title, ownValues);
    if (signature.length < MIN_SIGNATURE_LENGTH) return [];

    const candidates = await this.prisma.product.findMany({
      where: { brandId: product.brandId, categoryId: product.categoryId, id: { not: product.id } },
      include: { listings: { include: { price: true } } },
    });

    const matched = candidates.filter((c) => {
      const cValues = ownSingleValuedSpecs((c.specs as Record<string, string> | null) ?? null);
      if (cValues.length === 0) return false;
      return variantBaseSignature(c.title, cValues) === signature;
    });
    if (matched.length === 0) return [];

    const group = [product, ...matched];
    const groupOwnValues = group.map(
      (p) =>
        new Map(
          ownSingleValuedSpecs((p.specs as Record<string, string> | null) ?? null).map((v) => [
            v.key,
            v.value,
          ]),
        ),
    );

    // A key only earns a place in the label when it's a REAL, verified point
    // of difference within this exact group — present as a single value on
    // ≥2 members with ≥2 distinct values among them. This is what keeps
    // constant facts ("Brand: Apple", "Water Resistant: Yes") out of the
    // label and only surfaces what actually distinguishes these listings.
    const allKeys = new Set<string>();
    groupOwnValues.forEach((m) => m.forEach((_, k) => allKeys.add(k)));
    const diffKeys = [...allKeys].filter((key) => {
      const vals = groupOwnValues.map((m) => m.get(key)).filter((v): v is string => v != null);
      return vals.length >= 2 && new Set(vals).size >= 2;
    });

    const toSibling = (
      p: typeof product,
      ownMap: Map<string, string>,
      isCurrent: boolean,
    ): VariantSibling => {
      const row = toProductRow(p);
      // Falls back to the product's own title when no key safely differs
      // between every member of the group (e.g. the differing attribute is
      // packed/ambiguous on one side) — still real, still honest, just not a
      // single crisp "256 GB · Black"-style distinguisher.
      const label =
        diffKeys
          .map((k) => ownMap.get(k))
          .filter(Boolean)
          .join(' · ') || p.title;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        imageUrl: p.primaryImageUrl,
        label,
        lowestPrice: row.lowestPrice,
        isCurrent,
      };
    };

    return group.map((p, i) => toSibling(p, groupOwnValues[i], p.id === product.id));
  }
}
