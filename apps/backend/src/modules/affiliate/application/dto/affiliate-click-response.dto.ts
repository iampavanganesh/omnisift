import { ApiProperty } from '@nestjs/swagger';
import { AffiliateClick } from '../../domain/entities/affiliate-click.entity';

export class AffiliateClickResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productTitle!: string;
  @ApiProperty({ nullable: true }) productImageUrl!: string | null;
  @ApiProperty() sellerName!: string;
  @ApiProperty() targetUrl!: string;
  @ApiProperty() clickedAt!: string;

  static from(c: AffiliateClick): AffiliateClickResponseDto {
    return {
      id: c.id,
      productId: c.productId,
      productTitle: c.productTitle,
      productImageUrl: c.productImageUrl,
      sellerName: c.sellerName,
      targetUrl: c.targetUrl,
      clickedAt: c.clickedAt.toISOString(),
    };
  }
}
