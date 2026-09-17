import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { NotFoundError } from '../../../../core/errors/app-error';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly repo: UserRepository) {}
  async execute(userId: string, fallbackEmail?: string): Promise<UserProfile> {
    const profile = await this.repo.findById(userId);
    if (!profile) {
      // Row should exist (created on signup); guard against edge cases.
      if (fallbackEmail) return new UserProfile(userId, fallbackEmail, null, null, false);
      throw new NotFoundError('Profile not found.');
    }
    return profile;
  }
}
