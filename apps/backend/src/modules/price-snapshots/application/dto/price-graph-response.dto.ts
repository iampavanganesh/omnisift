import { ApiProperty } from '@nestjs/swagger';

/**
 * Documentation-only mirror of the object GET /products/price-graph builds
 * inline (price-history.controller.ts). The controller returns plain objects;
 * these classes exist purely so that shape has a real OpenAPI schema.
 */
export class PriceGraphPointDto {
  @ApiProperty({ description: 'Observed price for this seller at capture time.' })
  price!: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Seller-listed MRP at capture time, when the provider supplied one.',
  })
  mrp!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Discount off the seller-listed price at capture time. Not a drop relative to an earlier OmniSift observation.',
  })
  discountPct!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  capturedAt!: Date;
}

export class PriceGraphSeriesDto {
  @ApiProperty()
  sellerId!: string;

  @ApiProperty()
  sellerName!: string;

  @ApiProperty({ type: [PriceGraphPointDto], description: 'Chronological points for this seller.' })
  points!: PriceGraphPointDto[];
}

export class PriceGraphResponseDto {
  @ApiProperty({
    type: [PriceGraphSeriesDto],
    description: 'One series per seller that has recorded history in the requested range.',
  })
  series!: PriceGraphSeriesDto[];
}
