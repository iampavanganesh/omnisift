import { Module } from '@nestjs/common';
import { PriceSnapshotListener } from './application/listeners/price-snapshot.listener';
import { PriceHistoryController } from './presentation/controllers/price-history.controller';
import { PriceSnapshotRepository } from './domain/repositories/price-snapshot.repository';
import { PrismaPriceSnapshotRepository } from './infrastructure/repositories/prisma-price-snapshot.repository';

@Module({
  controllers: [PriceHistoryController],
  providers: [
    PriceSnapshotListener,
    { provide: PriceSnapshotRepository, useClass: PrismaPriceSnapshotRepository },
  ],
})
export class PriceSnapshotsModule {}
