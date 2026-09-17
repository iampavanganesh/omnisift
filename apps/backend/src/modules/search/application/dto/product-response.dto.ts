import { ApiProperty } from '@nestjs/swagger';
import { ProviderProduct } from '../../../../shared/interfaces/product-provider.interface';
import { categorize, resolveBrand } from '../../../../shared/utils/catalog-clean';

export class ProductResponseDto {
  @ApiProperty() token!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() platform!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ nullable: true }) oldPrice!: number | null;
  @ApiProperty() currency!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() productUrl!: string;
  @ApiProperty({ nullable: true }) rating!: number | null;
  @ApiProperty({ nullable: true }) reviewCount!: number | null;
  @ApiProperty() delivery!: string;
  /** Display-only, computed on every response — not persisted with the cache. */
  @ApiProperty() brand!: string;
  /** Display-only, same keyword rules as the real catalog — lets Search filter
   *  by the same fixed taxonomy before a product is ever acquired. */
  @ApiProperty() category!: string;

  static from(p: ProviderProduct): ProductResponseDto {
    return { ...p, brand: resolveBrand(null, p.title), category: categorize(p.title) };
  }
}
