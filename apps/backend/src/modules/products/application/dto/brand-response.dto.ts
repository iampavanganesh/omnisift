import { ApiProperty } from '@nestjs/swagger';
import { BrandWithCount } from '../../domain/repositories/brand-query.repository';

export class BrandResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() productCount!: number;
  @ApiProperty({ nullable: true }) logoUrl!: string | null;
  @ApiProperty({ nullable: true }) description!: string | null;

  static from(r: BrandWithCount): BrandResponseDto {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      productCount: r.productCount,
      logoUrl: r.logoUrl,
      description: r.description,
    };
  }
}
