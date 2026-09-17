import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { SellerCountMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { GetComparisonUseCase } from '../../application/usecases/get-comparison.usecase';
import { ComparisonResponseDto } from '../../application/dto/comparison-response.dto';
import { comparisonSchema, type ComparisonInput } from '../validators/compare.schemas';

@ApiTags('compare')
@Controller('compare')
export class CompareController {
  constructor(private readonly getComparison: GetComparisonUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Compare a product across sellers by provider token',
    description:
      'Public (guest). Served from the compare cache inside the 24h freshness window; otherwise re-fetched from the provider. `availability` is deliberately absent — the provider supplies no real stock signal.',
  })
  @ApiZodQuery(comparisonSchema, {
    token: 'Provider comparison token from a search result.',
    productId: 'Provider product id. Optional; when present it is used as the cache key.',
  })
  @ApiEnvelopeOk(ComparisonResponseDto, { meta: SellerCountMetaDto })
  @ApiErrors('validation', 'notFound', 'provider')
  async compare(@Query(new ZodValidationPipe(comparisonSchema)) query: ComparisonInput) {
    const data = await this.getComparison.execute(query.token, query.productId);
    return ApiResponse.ok(ComparisonResponseDto.from(data), { sellerCount: data.sellers.length });
  }
}
