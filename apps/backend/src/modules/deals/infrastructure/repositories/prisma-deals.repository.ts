import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { DealsRepository, DealRow } from '../../domain/repositories/deals.repository';

@Injectable()
export class PrismaDealsRepository implements DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async topDeals(limit: number): Promise<DealRow[]> {
    // NOT OUT_OF_STOCK rather than = IN_STOCK: SerpAPI's search/immersive
    // responses never carry a real stock-status signal, so `availability` is
    // always written as UNKNOWN at ingestion (see catalog.prisma.repository.ts).
    // Requiring IN_STOCK here excluded every row that has ever existed —
    // this endpoint returned [] regardless of how much discounted data existed.
    const rows = await this.prisma.price.findMany({
      where: { availability: { not: 'OUT_OF_STOCK' }, discountPct: { gt: 0 } },
      orderBy: { discountPct: 'desc' },
      take: limit,
      include: { listing: { include: { product: true, seller: true } } },
    });
    return rows.map((r) => ({
      productId: r.listing.product.id,
      productSlug: r.listing.product.slug,
      title: r.listing.product.title,
      imageUrl: r.listing.product.primaryImageUrl ?? r.listing.imageUrl,
      platform: r.listing.seller.name,
      price: Number(r.currentPrice),
      mrp: r.mrp === null ? null : Number(r.mrp),
      discountPct: r.discountPct ?? 0,
      productUrl: r.listing.productUrl,
      currency: r.currency,
    }));
  }
}
