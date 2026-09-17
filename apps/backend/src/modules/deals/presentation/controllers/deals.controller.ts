import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { DealsRepository } from '../../domain/repositories/deals.repository';
import { DealResponseDto } from '../../application/dto/deal-response.dto';
import { dealsSchema, type DealsInput } from '../validators/deals.schemas';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly repo: DealsRepository) {}

  @Get()
  @ApiOperation({
    summary: 'Biggest current discounts',
    description:
      'Public (guest). Ranked by discountPct — the SELLER-ADVERTISED discount off list price (or MRP vs price). These are NOT validated against a typical or historical price, and are not observed price drops; price alerts are the observed-drop feature. Rows with availability OUT_OF_STOCK are excluded; no positive stock claim is implied.',
  })
  @ApiZodQuery(dealsSchema, { limit: 'Maximum rows to return.' })
  @ApiEnvelopeOk(DealResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('validation')
  async list(@Query(new ZodValidationPipe(dealsSchema)) query: DealsInput) {
    const rows = await this.repo.topDeals(query.limit);
    return ApiResponse.ok(rows.map(DealResponseDto.from), { count: rows.length });
  }
}
