import { ApiProperty } from '@nestjs/swagger';
import { ProductDetail } from '../../domain/repositories/product-query.repository';
import {
  computeProductOmni,
  ProductOmniTake,
} from '../../../../shared/domain/compute-product-omni';
import { OmniTakeDto } from '../../../../shared/dto/omni-take.dto';

export class ProductDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) brand!: { name: string; slug: string } | null;
  @ApiProperty({ nullable: true }) category!: { name: string; slug: string } | null;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty({ type: [String] }) images!: string[];
  @ApiProperty({ nullable: true }) specs!: Record<string, string> | null;
  @ApiProperty({ nullable: true }) lowestPrice!: number | null;
  @ApiProperty() sellers!: {
    sellerId: string;
    sellerName: string;
    price: number;
    mrp: number | null;
    discountPct: number | null;
    currency: string;
  }[];
  /** Deterministic explanation (ADR-0002) — null only when there are no sellers to reason about. */
  // Explicit `type` — ProductOmniTake is an interface, so without it the
  // Swagger plugin emits an opaque `object`. Documentation-only; the runtime
  // value is unchanged.
  @ApiProperty({ type: OmniTakeDto, nullable: true }) omni!: ProductOmniTake | null;
  /** Captured whenever a live comparison was fetched for this product (compare module) —
   * null/empty until that's happened at least once, never fabricated. */
  @ApiProperty({ nullable: true }) rating!: number | null;
  @ApiProperty({ nullable: true }) reviewCount!: number | null;
  @ApiProperty() ratingBreakdown!: { stars: number; amount: number }[];
  @ApiProperty() reviews!: {
    title: string;
    text: string;
    userName: string;
    source: string;
    rating: number | null;
    date: string;
  }[];

  static from(d: ProductDetail): ProductDetailResponseDto {
    const omni = computeProductOmni(
      d.sellers.map((s) => ({ price: s.price, discountPct: s.discountPct })),
    );
    return { ...d, omni };
  }
}
