// C:\omnisift_final\apps\backend\src\modules\notifications\presentation\controllers\device-token.controller.ts
import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { OkResultDto } from '../../../../shared/dto/common-response.dto';
import {
  ApiEnvelopeCreated,
  ApiEnvelopeOk,
} from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodBody } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { JwtAuthGuard, type AuthUser } from '../../../../core/security/jwt-auth.guard';
import { CurrentUser } from '../../../../core/security/current-user.decorator';
import { RegisterDeviceTokenUseCase } from '../../application/usecases/register-device-token.usecase';
import { deviceTokenSchema, type DeviceTokenBody } from '../validators/device-token.schemas';

@ApiTags('device-tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('device-tokens')
export class DeviceTokenController {
  constructor(private readonly useCase: RegisterDeviceTokenUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Register an FCM device token for push',
    description: 'Requires authentication. Idempotent per token.',
  })
  @ApiZodBody(deviceTokenSchema)
  @ApiEnvelopeCreated(OkResultDto)
  @ApiErrors('validation', 'auth')
  async register(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(deviceTokenSchema)) body: DeviceTokenBody,
  ) {
    await this.useCase.register(user.id, body.token, body.platform ?? null);
    return ApiResponse.ok({ ok: true });
  }

  @Delete()
  @ApiOperation({
    summary: 'Unregister a device token',
    description: 'Requires authentication. The token is sent in the request BODY, not the path.',
  })
  @ApiZodBody(deviceTokenSchema)
  @ApiEnvelopeOk(OkResultDto)
  @ApiErrors('validation', 'auth')
  async unregister(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(deviceTokenSchema)) body: DeviceTokenBody,
  ) {
    await this.useCase.unregister(user.id, body.token);
    return ApiResponse.ok({ ok: true });
  }
}
