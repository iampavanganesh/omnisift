import { Injectable } from '@nestjs/common';
import { WishlistRepository } from '../../domain/repositories/wishlist.repository';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import { SearchCacheRepository } from '../../../search/domain/repositories/search-cache.repository';

export interface WishlistItemWithPrice {
  item: WishlistItem;
  currentPrice: number | null;
}

@Injectable()
export class GetWishlistUseCase {
  constructor(
    private readonly repo: WishlistRepository,
    private readonly searchCache: SearchCacheRepository,
  ) {}

  async execute(userId: string): Promise<WishlistItemWithPrice[]> {
    const items = await this.repo.list(userId);
    const priceMap = await this.searchCache.getCurrentPrices(items.map((i) => i.productId));
    return items.map((item) => ({
      item,
      currentPrice: priceMap.get(item.productId) ?? null,
    }));
  }
}
