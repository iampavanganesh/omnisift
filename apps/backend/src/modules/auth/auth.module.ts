import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUseCase } from './application/usecases/register.usecase';
import { LoginUseCase } from './application/usecases/login.usecase';
import { RefreshTokenUseCase } from './application/usecases/refresh-token.usecase';
import { LogoutUseCase } from './application/usecases/logout.usecase';
import { ForgotPasswordUseCase } from './application/usecases/forgot-password.usecase';
import { AuthRepository } from './domain/repositories/auth.repository';
import { SupabaseAuthRepository } from './infrastructure/repositories/supabase-auth.repository';
import { GoogleSignInUseCase } from './application/usecases/google-signin.usecase';

@Module({
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    GoogleSignInUseCase,
    { provide: AuthRepository, useClass: SupabaseAuthRepository },
  ],
})
export class AuthModule {}
