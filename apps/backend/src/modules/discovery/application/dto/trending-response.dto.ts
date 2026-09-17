import { ApiProperty } from '@nestjs/swagger';
import { CatalogProductRow } from '../../../products/domain/repositories/catalog-detail.types';

export class TrendingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty({ nullable: true }) lowestPrice!: number | null;
  @ApiProperty({ nullable: true }) discountPct!: number | null;
  @ApiProperty() sellerCount!: number;

  static from(r: CatalogProductRow): TrendingResponseDto {
    return { ...r };
  }
}
