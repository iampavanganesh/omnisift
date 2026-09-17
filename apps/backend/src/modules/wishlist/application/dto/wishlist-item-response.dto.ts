import { ApiProperty } from '@nestjs/swagger';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';

export class WishlistItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() token!: string;
  @ApiProperty() title!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() price!: number; // saved price (frozen at save time)
  @ApiProperty() platform!: string;
  @ApiProperty() productUrl!: string;
  @ApiProperty({ nullable: true }) currentPrice!: number | null; // live from search_cache

  static from(w: WishlistItem, currentPrice: number | null): WishlistItemResponseDto {
    return {
      id: w.id,
      productId: w.productId,
      token: w.token,
      title: w.title,
      imageUrl: w.imageUrl,
      price: w.price,
      platform: w.platform,
      productUrl: w.productUrl,
      currentPrice,
    };
  }
}
