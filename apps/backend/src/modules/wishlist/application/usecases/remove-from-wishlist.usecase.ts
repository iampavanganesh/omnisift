import { Injectable } from '@nestjs/common';
import { WishlistRepository } from '../../domain/repositories/wishlist.repository';

@Injectable()
export class RemoveFromWishlistUseCase {
  constructor(private readonly repo: WishlistRepository) {}

  execute(userId: string, productId: string): Promise<void> {
    return this.repo.remove(userId, productId);
  }

  /** Remove ALL of the user's saved products (the "Clear all" action). */
  clearAll(userId: string): Promise<void> {
    return this.repo.clearAll(userId);
  }
}
