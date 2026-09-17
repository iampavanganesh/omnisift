import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from '../../../search/application/dto/product-response.dto';

/**
 * Documentation-only mirror of what the most-searched routes return:
 * `{ ...ProductResponseDto.from(product), searchCount }` — a search product row
 * with the real observed search count appended. The controller builds that
 * object by spread; this class only gives it a schema.
 *
 * `searchCount` is derived from logged search analytics over the requested
 * window, never fabricated — routes hide the section rather than pad it when
 * there is no real data.
 */
export class MostSearchedProductDto extends ProductResponseDto {
  @ApiProperty({
    description: 'Times this product was returned for a search in the requested `hours` window.',
  })
  searchCount!: number;
}
