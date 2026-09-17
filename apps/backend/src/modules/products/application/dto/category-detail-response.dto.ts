import { ApiProperty } from '@nestjs/swagger';
import { CategoryDetail } from '../../domain/repositories/category-query.repository';

export class CategoryDetailResponseDto {
  @ApiProperty() category!: { id: string; name: string; slug: string };
  @ApiProperty() insights!: {
    productCount: number;
    avgLowestPrice: number | null;
    topDiscountPct: number | null;
  };
  @ApiProperty() brandsInCategory!: {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    logoUrl: string | null;
  }[];
  @ApiProperty({ nullable: true }) topDeal!: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    lowestPrice: number | null;
    discountPct: number | null;
    sellerCount: number;
  } | null;
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

  static from(d: CategoryDetail): CategoryDetailResponseDto {
    return { ...d };
  }
}
