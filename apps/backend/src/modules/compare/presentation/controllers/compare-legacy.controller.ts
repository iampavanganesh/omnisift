import { Controller, Get, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { GetComparisonUseCase } from '../../application/usecases/get-comparison.usecase';
import { ComparisonResponseDto } from '../../application/dto/comparison-response.dto';
import { comparisonSchema, type ComparisonInput } from '../validators/compare.schemas';

/**
 * DEPRECATED backward-compatible alias for the original route
 * `GET /api/v1/products/comparison`. The canonical route is now
 * `GET /api/v1/compare` (CompareController). Kept so the existing client keeps
 * working; remove once the client migrates. Hidden from Swagger.
 */
@ApiTags('compare')
@Controller('products')
export class CompareLegacyController {
  constructor(private readonly getComparison: GetComparisonUseCase) {}

  @Get('comparison')
  @ApiExcludeEndpoint()
  async comparison(@Query(new ZodValidationPipe(comparisonSchema)) query: ComparisonInput) {
    const data = await this.getComparison.execute(query.token, query.productId);
    return ApiResponse.ok(ComparisonResponseDto.from(data), { sellerCount: data.sellers.length });
  }
}
