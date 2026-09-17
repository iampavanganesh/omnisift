import { ApiProperty } from '@nestjs/swagger';
import { VariantSibling } from '../../domain/repositories/catalog-detail.types';

export class VariantSiblingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty() label!: string;
  @ApiProperty({ nullable: true }) lowestPrice!: number | null;
  @ApiProperty() isCurrent!: boolean;

  static from(s: VariantSibling): VariantSiblingResponseDto {
    return { ...s };
  }
}
