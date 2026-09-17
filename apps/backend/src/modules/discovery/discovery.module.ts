import { Module } from '@nestjs/common';
import { DiscoveryController } from './presentation/controllers/discovery.controller';
import { TrendingRepository } from './domain/repositories/trending.repository';
import { PrismaTrendingRepository } from './infrastructure/repositories/prisma-trending.repository';

/**
 * Discovery module — cross-cutting read feeds over the catalog (trending
 * today; deals/categories/brands already have their own homes, see
 * ARCHITECTURE.md's module table, and aren't duplicated here).
 */
@Module({
  controllers: [DiscoveryController],
  providers: [{ provide: TrendingRepository, useClass: PrismaTrendingRepository }],
})
export class DiscoveryModule {}
