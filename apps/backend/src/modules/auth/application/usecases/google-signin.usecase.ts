import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthSession } from '../../domain/entities/auth-session.entity';

@Injectable()
export class GoogleSignInUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(idToken: string, accessToken?: string): Promise<AuthSession> {
    return this.repo.googleSignIn(idToken, accessToken);
  }
}
