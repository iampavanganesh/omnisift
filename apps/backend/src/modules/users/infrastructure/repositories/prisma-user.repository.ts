import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { UpdateProfileInput, UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserProfile | null> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u ? new UserProfile(u.id, u.email, u.fullName, u.phone, u.profileCompleted) : null;
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<UserProfile> {
    const u = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        profileCompleted: true,
      },
    });
    return new UserProfile(u.id, u.email, u.fullName, u.phone, u.profileCompleted);
  }
}
