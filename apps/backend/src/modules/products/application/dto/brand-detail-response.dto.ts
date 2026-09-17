import { ApiProperty } from '@nestjs/swagger';
import { BrandDetail } from '../../domain/repositories/brand-query.repository';

export class BrandDetailResponseDto {
  @ApiProperty() brand!: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
  };
  @ApiProperty() insights!: {
    productCount: number;
    avgLowestPrice: number | null;
    topDiscountPct: number | null;
  };
  @ApiProperty() categoriesForBrand!: {
    id: string;
    name: string;
    slug: string;
    productCount: number;
  }[];
  @ApiProperty() sellersForBrand!: { id: string; name: string; productCount: number }[];
  @ApiProperty() products!: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    lowestPrice: number | null;
    discountPct: number | null;
    sellerCount: number;
  }[];
  @ApiProperty() hasMore!: boolean;

  static from(d: BrandDetail): BrandDetailResponseDto {
    return { ...d };
  }
}
