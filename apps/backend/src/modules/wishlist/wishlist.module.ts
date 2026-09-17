import { SearchModule } from '../search/search.module';
import { Module } from '@nestjs/common';
import { WishlistController } from './presentation/controllers/wishlist.controller';
import { AddToWishlistUseCase } from './application/usecases/add-to-wishlist.usecase';
import { RemoveFromWishlistUseCase } from './application/usecases/remove-from-wishlist.usecase';
import { GetWishlistUseCase } from './application/usecases/get-wishlist.usecase';
import { WishlistRepository } from './domain/repositories/wishlist.repository';
import { PrismaWishlistRepository } from './infrastructure/repositories/prisma-wishlist.repository';

@Module({
  imports: [SearchModule],
  controllers: [WishlistController],
  providers: [
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
    GetWishlistUseCase,
    { provide: WishlistRepository, useClass: PrismaWishlistRepository },
  ],
})
export class WishlistModule {}
