import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthSession } from '../../domain/entities/auth-session.entity';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(refreshToken: string): Promise<AuthSession> {
    return this.repo.refresh(refreshToken);
  }
}
