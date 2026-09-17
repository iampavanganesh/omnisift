import { UserProfile } from '../entities/user-profile.entity';

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
}

export abstract class UserRepository {
  abstract findById(id: string): Promise<UserProfile | null>;
  abstract updateProfile(id: string, input: UpdateProfileInput): Promise<UserProfile>;
}
