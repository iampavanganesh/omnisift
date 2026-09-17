import { ApiProperty } from '@nestjs/swagger';

/**
 * Documentation-only mirror of `CategoryFacet`
 * (products/domain/repositories/category-query.repository.ts), which
 * GET /categories/:slug/facets returns directly. The controller passes the
 * repository objects straight through; these classes only give that shape a
 * schema.
 *
 * Facets are data-driven — derived from the specs real products in the
 * category actually carry — not a hardcoded per-category taxonomy.
 */
export class CategoryFacetValueDto {
  @ApiProperty({ description: 'One observed value for this spec key.' })
  value!: string;

  @ApiProperty({ description: 'How many products in the category have this value.' })
  count!: number;
}

export class CategoryFacetDto {
  @ApiProperty({ description: 'Spec key, e.g. "RAM". Percent-encode when building `specs`.' })
  key!: string;

  @ApiProperty({ type: [CategoryFacetValueDto] })
  values!: CategoryFacetValueDto[];
}
