import { Injectable } from '@nestjs/common';
import {
  SaveWishlistInput,
  WishlistRepository,
} from '../../domain/repositories/wishlist.repository';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { BusinessRuleError } from '../../../../core/errors/app-error';

@Injectable()
export class AddToWishlistUseCase {
  constructor(
    private readonly repo: WishlistRepository,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  async execute(userId: string, input: SaveWishlistInput): Promise<WishlistItem> {
    // Re-saving an already-saved product is an UPDATE, not a new item — never
    // blocked. Only a genuinely NEW product counts against the limit.
    const already = await this.repo.exists(userId, input.productId);
    if (!already) {
      const [count, max] = await Promise.all([
        this.repo.count(userId),
        this.runtimeConfig.getWishlistMaxItems(),
      ]);
      if (count >= max) {
        throw new BusinessRuleError(
          `Wishlist limit reached (${max}). Remove an item to add a new one.`,
        );
      }
    }
    return this.repo.add(userId, input);
  }
}
