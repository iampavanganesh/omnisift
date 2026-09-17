import { Module } from '@nestjs/common';
import { AffiliateController } from './presentation/controllers/affiliate.controller';
import { AffiliateRedirectController } from './presentation/controllers/affiliate-redirect.controller';
import { RecordAffiliateClickUseCase } from './application/usecases/record-affiliate-click.usecase';
import { GetAffiliateClickHistoryUseCase } from './application/usecases/get-affiliate-click-history.usecase';
import { AffiliateClickRepository } from './domain/repositories/affiliate-click.repository';
import { PrismaAffiliateClickRepository } from './infrastructure/repositories/prisma-affiliate-click.repository';
import { ListingLookupRepository } from './domain/repositories/listing-lookup.repository';
import { PrismaListingLookupRepository } from './infrastructure/repositories/prisma-listing-lookup.repository';

@Module({
  controllers: [AffiliateController, AffiliateRedirectController],
  providers: [
    RecordAffiliateClickUseCase,
    GetAffiliateClickHistoryUseCase,
    { provide: AffiliateClickRepository, useClass: PrismaAffiliateClickRepository },
    { provide: ListingLookupRepository, useClass: PrismaListingLookupRepository },
  ],
})
export class AffiliateModule {}
