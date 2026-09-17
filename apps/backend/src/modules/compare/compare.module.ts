import { Module } from '@nestjs/common';
import { SerpapiModule } from '../../integrations/providers/serpapi/serpapi.module';
import { ProductsModule } from '../products/products.module';
import { SearchModule } from '../search/search.module';
import { CompareController } from './presentation/controllers/compare.controller';
import { CompareLegacyController } from './presentation/controllers/compare-legacy.controller';
import { CompareByProductController } from './presentation/controllers/compare-by-product.controller';
import { GetComparisonUseCase } from './application/usecases/get-comparison.usecase';
import { GetComparisonByProductUseCase } from './application/usecases/get-comparison-by-product.usecase';
import { CompareCacheRepository } from './domain/repositories/compare-cache.repository';
import { CompareCachePrismaRepository } from './infrastructure/repositories/compare-cache.prisma.repository';

/**
 * Compare module — multi-seller comparison + compare cache. Depends on
 * ProductsModule (acquisition), SerpapiModule (provider), and SearchModule
 * (to heal search_cache prices after a compare).
 */
@Module({
  imports: [SerpapiModule, ProductsModule, SearchModule],
  controllers: [CompareController, CompareLegacyController, CompareByProductController],
  providers: [
    GetComparisonUseCase,
    GetComparisonByProductUseCase,
    { provide: CompareCacheRepository, useClass: CompareCachePrismaRepository },
  ],
  exports: [GetComparisonByProductUseCase],
})
export class CompareModule {}
