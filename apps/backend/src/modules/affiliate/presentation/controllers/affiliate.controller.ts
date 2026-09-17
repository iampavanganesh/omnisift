import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { PageMetaDto } from '../../../../shared/dto/common-response.dto';
import {
  ApiEnvelopeCreated,
  ApiEnvelopeOk,
} from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodBody, ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { JwtAuthGuard, type AuthUser } from '../../../../core/security/jwt-auth.guard';
import { CurrentUser } from '../../../../core/security/current-user.decorator';
import { RecordAffiliateClickUseCase } from '../../application/usecases/record-affiliate-click.usecase';
import { GetAffiliateClickHistoryUseCase } from '../../application/usecases/get-affiliate-click-history.usecase';
import { AffiliateClickResponseDto } from '../../application/dto/affiliate-click-response.dto';
import {
  recordClickSchema,
  clickHistorySchema,
  type RecordClickBody,
  type ClickHistoryInput,
} from '../validators/affiliate.schemas';

@ApiTags('affiliate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('affiliate')
export class AffiliateController {
  constructor(
    private readonly recordUseCase: RecordAffiliateClickUseCase,
    private readonly historyUseCase: GetAffiliateClickHistoryUseCase,
  ) {}

  @Post('clicks')
  @ApiOperation({
    summary: 'Record an affiliate click',
    description:
      'Requires authentication. SECURITY: the request body carries NO destination URL and none is accepted. The server resolves the real ProductListing for (productId, platform) and stores that URL; when no such listing exists the click is REJECTED with 404 (fail closed) rather than trusting anything the caller supplied.',
  })
  @ApiZodBody(
    recordClickSchema,
    'productId + platform only. A client-supplied destination URL is never accepted or persisted.',
  )
  @ApiEnvelopeCreated(AffiliateClickResponseDto)
  @ApiErrors('validation', 'auth', 'notFound')
  async record(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(recordClickSchema)) body: RecordClickBody,
  ) {
    const click = await this.recordUseCase.execute(user.id, body);
    return ApiResponse.ok(AffiliateClickResponseDto.from(click));
  }

  @Get('clicks')
  @ApiOperation({
    summary: "The signed-in user's affiliate click history",
    description:
      'Requires authentication. targetUrl on each row is the server-resolved listing URL recorded at click time, never a client-supplied value.',
  })
  @ApiZodQuery(clickHistorySchema, { page: 'Zero-based page index.', pageSize: 'Rows per page.' })
  @ApiEnvelopeOk(AffiliateClickResponseDto, { isArray: true, meta: PageMetaDto })
  @ApiErrors('validation', 'auth')
  async history(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(clickHistorySchema)) query: ClickHistoryInput,
  ) {
    const page = await this.historyUseCase.execute(user.id, query.page, query.pageSize);
    return ApiResponse.ok(page.items.map(AffiliateClickResponseDto.from), {
      hasMore: page.hasMore,
      page: query.page,
    });
  }
}
