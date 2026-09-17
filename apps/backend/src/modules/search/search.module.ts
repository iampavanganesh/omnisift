import { Module } from '@nestjs/common';
import { SerpapiModule } from '../../integrations/providers/serpapi/serpapi.module';
import { SearchController } from './presentation/controllers/search.controller';
import { SearchProductsUseCase } from './application/usecases/search-products.usecase';
import { GetSuggestionsUseCase } from './application/usecases/get-suggestions.usecase';
import { SuggestClient } from './infrastructure/suggest.client';
import { SearchCacheRepository } from './domain/repositories/search-cache.repository';
import { SearchCachePrismaRepository } from './infrastructure/repositories/search-cache.prisma.repository';

@Module({
  imports: [SerpapiModule],
  controllers: [SearchController],
  providers: [
    SearchProductsUseCase,
    GetSuggestionsUseCase,
    SuggestClient,
    { provide: SearchCacheRepository, useClass: SearchCachePrismaRepository },
  ],
  exports: [SearchCacheRepository],
})
export class SearchModule {}
