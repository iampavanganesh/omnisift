import { ApiProperty } from '@nestjs/swagger';
import { AuthSession } from '../../domain/entities/auth-session.entity';

export class SessionResponseDto {
  @ApiProperty() userId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty() expiresAt!: number;

  static from(s: AuthSession): SessionResponseDto {
    return {
      userId: s.userId,
      email: s.email,
      accessToken: s.accessToken,
      refreshToken: s.refreshToken,
      expiresAt: s.expiresAt,
    };
  }
}
