import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(accessToken: string): Promise<void> {
    return this.repo.logout(accessToken);
  }
}
