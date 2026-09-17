// C:\omnisift_final\apps\backend\src\modules\notifications\infrastructure\repositories\prisma-device-token.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { DeviceTokenRepository } from '../../domain/repositories/device-token.repository';

@Injectable()
export class PrismaDeviceTokenRepository implements DeviceTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, token: string, platform: string | null): Promise<void> {
    if (!token) return;
    // token is unique. If the same token re-appears (e.g. account switch on one
    // device), re-point it to the current user and refresh lastSeenAt.
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }

  async remove(userId: string, token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }

  async tokensForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }

  async deleteToken(token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { token } });
  }
}
