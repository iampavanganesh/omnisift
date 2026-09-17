import { Module } from '@nestjs/common';
import { PriceObservedListener } from './application/listeners/price-observed.listener';
import { PriceHistoryRepository } from './domain/repositories/price-history.repository';
import { PriceHistoryPrismaRepository } from './infrastructure/repositories/price-history.prisma.repository';

/**
 * Price-intelligence module (ARCHITECTURE.md §4/§13) — owns snapshots + the
 * append-only price history. In this slice it subscribes to `price.observed`
 * and writes history; statistics/drop-detection land in later slices.
 */
@Module({
  providers: [
    PriceObservedListener,
    { provide: PriceHistoryRepository, useClass: PriceHistoryPrismaRepository },
  ],
})
export class PriceIntelligenceModule {}
