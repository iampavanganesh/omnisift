import { Module } from '@nestjs/common';
import { DealsController } from './presentation/controllers/deals.controller';
import { DealsRepository } from './domain/repositories/deals.repository';
import { PrismaDealsRepository } from './infrastructure/repositories/prisma-deals.repository';

@Module({
  controllers: [DealsController],
  providers: [{ provide: DealsRepository, useClass: PrismaDealsRepository }],
})
export class DealsModule {}
