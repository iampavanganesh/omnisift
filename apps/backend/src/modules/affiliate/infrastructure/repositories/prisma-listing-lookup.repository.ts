import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { slugify } from '../../../../shared/utils/normalize';
import { ListingLookupRepository } from '../../domain/repositories/listing-lookup.repository';

@Injectable()
export class PrismaListingLookupRepository implements ListingLookupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUrl(productId: string, sellerId: string): Promise<string | null> {
    const listing = await this.prisma.productListing.findFirst({
      where: { productId, sellerId },
      select: { productUrl: true },
    });
    return listing?.productUrl ?? null;
  }

  async findUrlByPlatform(productId: string, platform: string): Promise<string | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { slug: slugify(platform) },
      select: { id: true },
    });
    if (!seller) return null;
    return this.findUrl(productId, seller.id);
  }
}
