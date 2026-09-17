// C:\omnisift_final\apps\backend\src\modules\alerts\presentation\controllers\price-alert.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto, OkResultDto } from '../../../../shared/dto/common-response.dto';
import {
  ApiEnvelopeCreated,
  ApiEnvelopeOk,
} from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodBody } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { JwtAuthGuard, type AuthUser } from '../../../../core/security/jwt-auth.guard';
import { CurrentUser } from '../../../../core/security/current-user.decorator';
import { CreatePriceAlertUseCase } from '../../application/usecases/create-price-alert.usecase';
import { GetPriceAlertsUseCase } from '../../application/usecases/get-price-alerts.usecase';
import { DeletePriceAlertUseCase } from '../../application/usecases/delete-price-alert.usecase';
import { TogglePriceAlertUseCase } from '../../application/usecases/toggle-price-alert.usecase';
import { PriceAlertResponseDto } from '../../application/dto/price-alert-response.dto';
import {
  createAlertSchema,
  type CreateAlertBody,
  toggleAlertSchema,
  type ToggleAlertBody,
} from '../validators/price-alert.schemas';

@ApiTags('price-alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('price-alerts')
export class PriceAlertController {
  constructor(
    private readonly createUseCase: CreatePriceAlertUseCase,
    private readonly getUseCase: GetPriceAlertsUseCase,
    private readonly deleteUseCase: DeletePriceAlertUseCase,
    private readonly toggleUseCase: TogglePriceAlertUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List the signed-in user's price alerts",
    description: 'Requires authentication.',
  })
  @ApiEnvelopeOk(PriceAlertResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('auth')
  async list(@CurrentUser() user: AuthUser) {
    const alerts = await this.getUseCase.execute(user.id);
    return ApiResponse.ok(
      alerts.map((a) => PriceAlertResponseDto.from(a)),
      {
        count: alerts.length,
      },
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create or re-arm a price alert',
    description:
      'Requires authentication. Upserts on (user, product, type); re-setting an existing alert reactivates it and clears its previous fire state. Alerts fire on a price genuinely lower than the last observed one — this is the real observed-drop feature, unlike /deals.',
  })
  @ApiZodBody(
    createAlertSchema,
    'targetPrice is REQUIRED and must be > 0 when type is BELOW_TARGET (a cross-field rule JSON Schema cannot express; violating it returns 400).',
  )
  @ApiEnvelopeCreated(PriceAlertResponseDto)
  @ApiErrors('validation', 'auth', 'notFound')
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAlertSchema)) body: CreateAlertBody,
  ) {
    const alert = await this.createUseCase.execute(user.id, {
      productId: body.productId,
      type: body.type,
      targetPrice: body.targetPrice ?? null,
    });
    return ApiResponse.ok(PriceAlertResponseDto.from(alert));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Enable or disable an alert',
    description:
      'Requires authentication. Re-enabling clears the previous fire state so the alert can notify again.',
  })
  @ApiParam({ name: 'id', description: 'Alert id.' })
  @ApiZodBody(toggleAlertSchema)
  @ApiEnvelopeOk(PriceAlertResponseDto)
  @ApiErrors('validation', 'auth', 'notFound')
  async toggle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(toggleAlertSchema)) body: ToggleAlertBody,
  ) {
    const alert = await this.toggleUseCase.execute(user.id, id, body.isActive);
    return ApiResponse.ok(PriceAlertResponseDto.from(alert));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an alert', description: 'Requires authentication.' })
  @ApiParam({ name: 'id', description: 'Alert id.' })
  @ApiEnvelopeOk(OkResultDto)
  @ApiErrors('auth')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteUseCase.execute(user.id, id);
    return ApiResponse.ok({ ok: true });
  }
}
