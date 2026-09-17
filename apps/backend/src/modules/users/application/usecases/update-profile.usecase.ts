import { Injectable } from '@nestjs/common';
import { UpdateProfileInput, UserRepository } from '../../domain/repositories/user.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly repo: UserRepository) {}
  execute(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    return this.repo.updateProfile(userId, input);
  }
}
