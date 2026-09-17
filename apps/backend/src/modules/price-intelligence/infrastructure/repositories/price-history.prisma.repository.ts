import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';
import { PriceObservation } from '../../../../core/events/app-events';

/** Prisma implementation of the append-only price history (table: `price_history`). */
@Injectable()
export class PriceHistoryPrismaRepository extends PriceHistoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async recordMany(observations: PriceObservation[], observedAt: Date): Promise<void> {
    if (observations.length === 0) return;
    await this.prisma.priceHistory.createMany({
      data: observations.map((o) => ({
        listingId: o.listingId,
        providerId: o.providerId,
        price: o.price,
        mrp: o.mrp,
        currency: o.currency,
        availability: o.availability,
        discountPct: o.discountPct ?? null,
        sellerId: o.sellerId ?? null,
        observedAt,
      })),
    });
  }
}
