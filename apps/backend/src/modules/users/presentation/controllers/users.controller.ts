import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodBody } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { JwtAuthGuard, type AuthUser } from '../../../../core/security/jwt-auth.guard';
import { CurrentUser } from '../../../../core/security/current-user.decorator';
import { GetProfileUseCase } from '../../application/usecases/get-profile.usecase';
import { UpdateProfileUseCase } from '../../application/usecases/update-profile.usecase';
import { UserProfileResponseDto } from '../../application/dto/user-profile-response.dto';
import { updateProfileSchema, type UpdateProfileBody } from '../validators/user.schemas';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'The signed-in user profile',
    description: 'Requires authentication. Returns only the profile of the caller.',
  })
  @ApiEnvelopeOk(UserProfileResponseDto)
  @ApiErrors('auth', 'notFound')
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.getProfile.execute(user.id, user.email);
    return ApiResponse.ok(UserProfileResponseDto.from(profile));
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update the signed-in user profile',
    description:
      'Requires authentication. Both fields are optional; omitted fields are left unchanged.',
  })
  @ApiZodBody(updateProfileSchema)
  @ApiEnvelopeOk(UserProfileResponseDto)
  @ApiErrors('validation', 'auth', 'notFound')
  async update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileBody,
  ) {
    const profile = await this.updateProfile.execute(user.id, body);
    return ApiResponse.ok(UserProfileResponseDto.from(profile));
  }
}
