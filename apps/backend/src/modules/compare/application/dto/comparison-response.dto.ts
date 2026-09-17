import { ApiProperty } from '@nestjs/swagger';
import { ProviderComparison } from '../../../../shared/interfaces/product-provider.interface';
import {
  computeProductOmni,
  ProductOmniTake,
} from '../../../../shared/domain/compute-product-omni';
import { OmniTakeDto } from '../../../../shared/dto/omni-take.dto';

export class ComparisonResponseDto {
  @ApiProperty({ nullable: true }) productId!: string | null;
  @ApiProperty() title!: string;
  @ApiProperty() brand!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ nullable: true }) rating!: number | null;
  @ApiProperty({ nullable: true }) reviewCount!: number | null;
  @ApiProperty() priceRange!: string;
  @ApiProperty({ type: [String] }) images!: string[];
  @ApiProperty() specifications!: { name: string; value: string }[];
  @ApiProperty() sellers!: {
    platform: string;
    price: number;
    currency: string;
    link: string;
    logo: string;
  }[];
  /** Deterministic explanation (ADR-0002) — null only when there are no sellers to reason about. */
  // `type` is explicit because ProductOmniTake is an interface — without it the
  // Swagger plugin can only emit an opaque `object`. OmniTakeDto is a
  // documentation-only mirror of that same shape; the runtime value is
  // unchanged (still whatever computeProductOmni returns).
  @ApiProperty({ type: OmniTakeDto, nullable: true }) omni!: ProductOmniTake | null;
  /** Star histogram + written reviews, straight from the provider — empty when the
   * listing doesn't carry them (not every product has SerpAPI review data). */
  @ApiProperty() ratingBreakdown!: { stars: number; amount: number }[];
  @ApiProperty() userReviews!: {
    title: string;
    text: string;
    userName: string;
    source: string;
    rating: number | null;
    date: string;
    icon: string;
    images: string[];
  }[];

  static from(c: ProviderComparison): ComparisonResponseDto {
    const internalProductId =
      (c as ProviderComparison & { internalProductId?: string }).internalProductId ?? null;
    const omni = computeProductOmni(c.sellers.map((s) => ({ price: s.price })));
    return { ...c, productId: internalProductId, omni };
  }
}
