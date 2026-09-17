import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { SearchMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk, ApiEnvelopeOkRaw } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { SearchProductsUseCase } from '../../application/usecases/search-products.usecase';
import { GetSuggestionsUseCase } from '../../application/usecases/get-suggestions.usecase';
import { ProductResponseDto } from '../../application/dto/product-response.dto';
import { searchSchema, type SearchInput } from '../validators/search.schemas';
import { PAGINATION } from '../../../../shared/constants';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchProducts: SearchProductsUseCase,
    private readonly getSuggestions: GetSuggestionsUseCase,
  ) {}

  @Get('suggestions')
  @ApiOperation({
    summary: 'Search-as-you-type suggestions',
    description:
      'Public (guest). Real Google autocomplete terms proxied through the backend — never fabricated. Returns an empty list on provider failure rather than erroring.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    schema: { type: 'string' },
    description: 'Partial query. Not schema-validated; an empty/missing value returns [].',
  })
  @ApiEnvelopeOkRaw({ data: { type: 'array', items: { type: 'string' } } })
  @ApiErrors()
  async suggestions(@Query('q') q: string) {
    return ApiResponse.ok(await this.getSuggestions.execute(q ?? ''));
  }

  @Get()
  @ApiOperation({
    summary: 'Search products across tracked stores',
    description:
      'Public (guest). Pagination is FINITE: `page` is capped at PAGINATION.MAX_PAGES - 1 and a higher value is rejected with 400. Use `meta.hasMore` to decide whether to request another page — do not infer it from result count.',
  })
  @ApiZodQuery(searchSchema, {
    q: 'Search query.',
    page: 'Zero-based page index. Hard ceiling — requesting beyond it is a validation error.',
    maxPrice: 'Optional price ceiling, applied as a post-filter to the fetched page.',
  })
  @ApiEnvelopeOk(ProductResponseDto, { isArray: true, meta: SearchMetaDto })
  @ApiErrors('validation', 'provider')
  async search(@Query(new ZodValidationPipe(searchSchema)) query: SearchInput) {
    const result = await this.searchProducts.execute(query.q, query.page);
    const products =
      query.maxPrice != null
        ? result.products.filter((p) => p.price <= query.maxPrice!)
        : result.products;
    // Real ceiling (searchSchema Zod-enforces page <= MAX_PAGES - 1), not a
    // guess from "did this page have anything" — the client can trust this to
    // decide whether to request another page instead of inferring it.
    const hasMore = query.page < PAGINATION.MAX_PAGES - 1 && products.length > 0;
    return ApiResponse.ok(products.map(ProductResponseDto.from), {
      query: query.q,
      page: query.page,
      count: products.length,
      hasMore,
    });
  }
}
