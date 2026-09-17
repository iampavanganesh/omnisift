import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(email: string): Promise<void> {
    return this.repo.forgotPassword(email);
  }
}
