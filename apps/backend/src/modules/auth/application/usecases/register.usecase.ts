import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthSession } from '../../domain/entities/auth-session.entity';

@Injectable()
export class RegisterUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(input: { fullName: string; email: string; password: string }): Promise<AuthSession> {
    return this.repo.register(input);
  }
}
