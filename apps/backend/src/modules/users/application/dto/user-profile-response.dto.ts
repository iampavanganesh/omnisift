import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../../domain/entities/user-profile.entity';

export class UserProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true }) fullName!: string | null;
  @ApiProperty({ nullable: true }) phone!: string | null;
  @ApiProperty() profileCompleted!: boolean;

  static from(p: UserProfile): UserProfileResponseDto {
    return {
      id: p.id,
      email: p.email,
      fullName: p.fullName,
      phone: p.phone,
      profileCompleted: p.profileCompleted,
    };
  }
}
