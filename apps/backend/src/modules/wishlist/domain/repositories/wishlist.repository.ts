import { WishlistItem } from '../entities/wishlist-item.entity';

export interface SaveWishlistInput {
  productId: string;
  token: string;
  title: string;
  imageUrl: string;
  price: number;
  platform: string;
  productUrl: string;
}

export abstract class WishlistRepository {
  abstract add(userId: string, input: SaveWishlistInput): Promise<WishlistItem>;
  abstract remove(userId: string, productId: string): Promise<void>;
  abstract list(userId: string): Promise<WishlistItem[]>;
  abstract count(userId: string): Promise<number>;
  abstract exists(userId: string, productId: string): Promise<boolean>;
  abstract clearAll(userId: string): Promise<void>;
}
