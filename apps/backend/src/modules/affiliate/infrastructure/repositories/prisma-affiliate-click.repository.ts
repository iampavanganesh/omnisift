import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { NotFoundError } from '../../../../core/errors/app-error';
import { slugify } from '../../../../shared/utils/normalize';
import { AffiliateClick } from '../../domain/entities/affiliate-click.entity';
import {
  AffiliateClickHistoryPage,
  AffiliateClickRepository,
  RecordClickInput,
} from '../../domain/repositories/affiliate-click.repository';

type ClickRow = {
  id: string;
  productId: string;
  targetUrl: string;
  clickedAt: Date;
  product: { title: string; primaryImageUrl: string | null };
  seller: { name: string };
};

@Injectable()
export class PrismaAffiliateClickRepository implements AffiliateClickRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, input: RecordClickInput): Promise<AffiliateClick> {
    const seller = await this.prisma.seller.findUnique({
      where: { slug: slugify(input.platform) },
      select: { id: true },
    });
    if (!seller) {
      throw new NotFoundError(
        'Unable to record this click yet — try again after viewing the product.',
      );
    }
    // The destination URL always comes from the resolved listing, never from
    // the client — mirrors the /affiliate/go redirect's own trust model. If
    // no real (product, seller) listing exists, there is nothing verified to
    // record the click against, so this fails closed rather than falling
    // back to a client-asserted URL.
    const listing = await this.prisma.productListing.findFirst({
      where: { productId: input.productId, sellerId: seller.id },
      select: { id: true, productUrl: true },
    });
    if (!listing) {
      throw new NotFoundError(
        'Unable to record this click yet — try again after viewing the product.',
      );
    }
    const row = await this.prisma.affiliateClick.create({
      data: {
        userId,
        productId: input.productId,
        sellerId: seller.id,
        listingId: listing.id,
        targetUrl: listing.productUrl,
      },
      include: {
        product: { select: { title: true, primaryImageUrl: true } },
        seller: { select: { name: true } },
      },
    });
    return this.toEntity(row);
  }

  async history(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<AffiliateClickHistoryPage> {
    const rows = await this.prisma.affiliateClick.findMany({
      where: { userId },
      orderBy: { clickedAt: 'desc' },
      skip: page * pageSize,
      take: pageSize + 1,
      include: {
        product: { select: { title: true, primaryImageUrl: true } },
        seller: { select: { name: true } },
      },
    });
    const hasMore = rows.length > pageSize;
    return { items: rows.slice(0, pageSize).map((r) => this.toEntity(r)), hasMore };
  }

  private toEntity(r: ClickRow): AffiliateClick {
    return new AffiliateClick(
      r.id,
      r.productId,
      r.product.title,
      r.product.primaryImageUrl,
      r.seller.name,
      r.targetUrl,
      r.clickedAt,
    );
  }
}
