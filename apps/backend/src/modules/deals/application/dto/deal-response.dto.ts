import { ApiProperty } from '@nestjs/swagger';
import { DealRow } from '../../domain/repositories/deals.repository';

export class DealResponseDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productSlug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty() platform!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ nullable: true }) mrp!: number | null;
  @ApiProperty() discountPct!: number;
  @ApiProperty() productUrl!: string;
  @ApiProperty() currency!: string;

  static from(r: DealRow): DealResponseDto {
    return {
      productId: r.productId,
      productSlug: r.productSlug,
      title: r.title,
      imageUrl: r.imageUrl,
      platform: r.platform,
      price: r.price,
      mrp: r.mrp,
      discountPct: r.discountPct,
      productUrl: r.productUrl,
      currency: r.currency,
    };
  }
}
