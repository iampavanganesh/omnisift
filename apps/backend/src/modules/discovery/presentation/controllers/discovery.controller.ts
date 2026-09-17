import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { MostSearchedProductDto } from '../../application/dto/most-searched-response.dto';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { NotFoundError } from '../../../../core/errors/app-error';
import {
  TrendingRepository,
  MostSearchedResult,
} from '../../domain/repositories/trending.repository';
import { TrendingResponseDto } from '../../application/dto/trending-response.dto';
import { ProductResponseDto } from '../../../search/application/dto/product-response.dto';
import {
  trendingSchema,
  type TrendingInput,
  mostSearchedSchema,
  type MostSearchedInput,
} from '../validators/trending.schemas';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly repo: TrendingRepository) {}

  @Get('trending')
  @ApiOperation({
    summary: 'Trending products',
    description:
      'Public (guest). Derived from real logged activity; returns an empty list rather than padding when there is not enough data.',
  })
  @ApiZodQuery(trendingSchema, { limit: 'Maximum rows to return.' })
  @ApiEnvelopeOk(TrendingResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('validation')
  async trending(@Query(new ZodValidationPipe(trendingSchema)) query: TrendingInput) {
    const rows = await this.repo.listTrending(query.limit);
    return ApiResponse.ok(rows.map(TrendingResponseDto.from), { count: rows.length });
  }

  /** Real "most searched in the last N hours" — see PrismaTrendingRepository. */
  @Get('most-searched')
  @ApiOperation({
    summary: 'Most-searched products in a recent window',
    description:
      'Public (guest). searchCount comes from logged search analytics over the requested window — never fabricated.',
  })
  @ApiZodQuery(mostSearchedSchema, {
    hours: 'Look-back window in hours.',
    limit: 'Maximum rows to return.',
  })
  @ApiEnvelopeOk(MostSearchedProductDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('validation')
  async mostSearched(@Query(new ZodValidationPipe(mostSearchedSchema)) query: MostSearchedInput) {
    const results = await this.repo.listMostSearched(query.hours, query.limit);
    return ApiResponse.ok(results.map(DiscoveryController.toDto), { count: results.length });
  }

  /** Same signal, scoped to one category by slug. */
  @Get('most-searched/:category')
  @ApiOperation({
    summary: 'Most-searched products within one category',
    description: 'Public (guest). Same signal as /most-searched, scoped to a category slug.',
  })
  @ApiParam({ name: 'category', description: 'Category slug.' })
  @ApiZodQuery(mostSearchedSchema, {
    hours: 'Look-back window in hours.',
    limit: 'Maximum rows to return.',
  })
  @ApiEnvelopeOk(MostSearchedProductDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('validation', 'notFound')
  async mostSearchedInCategory(
    @Param('category') category: string,
    @Query(new ZodValidationPipe(mostSearchedSchema)) query: MostSearchedInput,
  ) {
    const results = await this.repo.listMostSearchedInCategory(category, query.hours, query.limit);
    if (results === null) throw new NotFoundError('Category not found.');
    return ApiResponse.ok(results.map(DiscoveryController.toDto), { count: results.length });
  }

  private static toDto(r: MostSearchedResult) {
    return { ...ProductResponseDto.from(r.product), searchCount: r.searchCount };
  }
}
