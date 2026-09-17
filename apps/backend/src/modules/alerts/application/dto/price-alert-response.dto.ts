// C:\omnisift_final\apps\backend\src\modules\alerts\application\dto\price-alert-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { PriceAlert } from '../../domain/entities/price-alert.entity';

export class PriceAlertResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() type!: string; // 'ANY_DROP' | 'BELOW_TARGET'
  @ApiProperty({ nullable: true }) targetPrice!: number | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ nullable: true }) lastTriggeredAt!: Date | null;
  @ApiProperty({ nullable: true }) lastNotifiedPrice!: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ nullable: true }) productTitle!: string | null;
  @ApiProperty({ nullable: true }) productImageUrl!: string | null;

  static from(a: PriceAlert): PriceAlertResponseDto {
    return {
      id: a.id,
      productId: a.productId,
      type: a.type,
      targetPrice: a.targetPrice,
      isActive: a.isActive,
      lastTriggeredAt: a.lastTriggeredAt,
      lastNotifiedPrice: a.lastNotifiedPrice,
      createdAt: a.createdAt,
      productTitle: a.productTitle,
      productImageUrl: a.productImageUrl,
    };
  }
}
