import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { OkResultDto } from '../../../../shared/dto/common-response.dto';
import {
  ApiEnvelopeCreated,
  ApiEnvelopeOk,
} from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodBody } from '../../../../shared/openapi/api-zod.decorator';
import { JwtAuthGuard } from '../../../../core/security/jwt-auth.guard';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { RegisterUseCase } from '../../application/usecases/register.usecase';
import { LoginUseCase } from '../../application/usecases/login.usecase';
import { RefreshTokenUseCase } from '../../application/usecases/refresh-token.usecase';
import { LogoutUseCase } from '../../application/usecases/logout.usecase';
import { ForgotPasswordUseCase } from '../../application/usecases/forgot-password.usecase';
import { GoogleSignInUseCase } from '../../application/usecases/google-signin.usecase';
import { SessionResponseDto } from '../../application/dto/session-response.dto';
import {
  forgotSchema,
  googleSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  type ForgotInput,
  type GoogleInput,
  type LoginInput,
  type RefreshInput,
  type RegisterInput,
} from '../validators/auth.schemas';

/** Thin controller: validate (Zod) → use case → response envelope. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotUseCase: ForgotPasswordUseCase,
    private readonly googleUseCase: GoogleSignInUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Create an account', description: 'Public. Returns a session.' })
  @ApiZodBody(registerSchema)
  @ApiEnvelopeCreated(SessionResponseDto)
  @ApiErrors('validation', 'businessRule')
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return ApiResponse.ok(SessionResponseDto.from(await this.registerUseCase.execute(body)));
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email and password', description: 'Public.' })
  @ApiZodBody(loginSchema)
  @ApiEnvelopeOk(SessionResponseDto)
  @ApiErrors('validation', 'auth')
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return ApiResponse.ok(SessionResponseDto.from(await this.loginUseCase.execute(body)));
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with Google', description: 'Public.' })
  @ApiZodBody(googleSchema)
  @ApiEnvelopeOk(SessionResponseDto)
  @ApiErrors('validation', 'auth')
  async google(@Body(new ZodValidationPipe(googleSchema)) body: GoogleInput) {
    return ApiResponse.ok(
      SessionResponseDto.from(await this.googleUseCase.execute(body.idToken, body.accessToken)),
    );
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new session',
    description: 'Public — the refresh token itself is the credential.',
  })
  @ApiZodBody(refreshSchema)
  @ApiEnvelopeOk(SessionResponseDto)
  @ApiErrors('validation', 'auth')
  async refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    return ApiResponse.ok(
      SessionResponseDto.from(await this.refreshUseCase.execute(body.refreshToken)),
    );
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session', description: 'Requires a bearer token.' })
  @ApiEnvelopeOk(OkResultDto)
  @ApiErrors('auth')
  async logout(@Headers('authorization') authorization: string) {
    await this.logoutUseCase.execute(authorization.slice(7));
    return ApiResponse.ok({ ok: true });
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send a password-reset email',
    description:
      'Public. Always reports success — the response does not reveal whether the address is registered.',
  })
  @ApiZodBody(forgotSchema)
  @ApiEnvelopeOk(OkResultDto)
  @ApiErrors('validation')
  async forgotPassword(@Body(new ZodValidationPipe(forgotSchema)) body: ForgotInput) {
    await this.forgotUseCase.execute(body.email);
    return ApiResponse.ok({ ok: true });
  }
}
