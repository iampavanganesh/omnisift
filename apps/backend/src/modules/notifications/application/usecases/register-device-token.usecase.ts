// C:\omnisift_final\apps\backend\src\modules\notifications\application\usecases\register-device-token.usecase.ts
import { Injectable } from '@nestjs/common';
import { DeviceTokenRepository } from '../../domain/repositories/device-token.repository';

@Injectable()
export class RegisterDeviceTokenUseCase {
  constructor(private readonly repo: DeviceTokenRepository) {}

  register(userId: string, token: string, platform: string | null): Promise<void> {
    return this.repo.upsert(userId, token, platform);
  }

  unregister(userId: string, token: string): Promise<void> {
    return this.repo.remove(userId, token);
  }
}
