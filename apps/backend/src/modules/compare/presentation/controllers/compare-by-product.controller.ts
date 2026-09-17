// C:\omnisift_final\apps\backend\src\modules\compare\presentation\controllers\compare-by-product.controller.ts
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CompareByProductMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ComparisonResponseDto } from '../../application/dto/comparison-response.dto';
import { GetComparisonByProductUseCase } from '../../application/usecases/get-comparison-by-product.usecase';

/**
 * Notification-tap endpoint. Given an internal productId, returns the current
 * comparison (cached if fresh, refreshed via token if stale). Public like the
 * normal compare route — no auth needed to view a product.
 */
@ApiTags('compare')
@Controller('products')
export class CompareByProductController {
  constructor(private readonly useCase: GetComparisonByProductUseCase) {}

  @Get('compare-by-product')
  @ApiOperation({
    summary: 'Compare by internal product id',
    description:
      'Public (guest). Serves the cached comparison when inside the 24h compare freshness window, otherwise re-fetches from the provider; on a failed refresh it serves the stale cache rather than erroring. meta reports which happened.',
  })
  @ApiQuery({
    name: 'productId',
    required: true,
    schema: { type: 'string' },
    description: 'Internal product UUID. Missing value returns 400.',
  })
  @ApiEnvelopeOk(ComparisonResponseDto, { meta: CompareByProductMetaDto })
  @ApiErrors('validation', 'notFound', 'provider')
  async byProduct(@Query('productId') productId?: string) {
    if (!productId) throw new BadRequestException('productId is required');
    const res = await this.useCase.execute(productId);
    return ApiResponse.ok(ComparisonResponseDto.from(res.comparison), {
      capturedAt: res.capturedAt,
      fresh: res.fresh,
      refreshed: res.refreshed,
    });
  }
}
