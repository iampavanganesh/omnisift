// C:\omnisift_final\apps\backend\src\modules\notifications\notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationController } from './presentation/controllers/notification.controller';
import { DeviceTokenController } from './presentation/controllers/device-token.controller';
import { CreateNotificationUseCase } from './application/usecases/create-notification.usecase';
import { GetNotificationsUseCase } from './application/usecases/get-notifications.usecase';
import { MarkNotificationReadUseCase } from './application/usecases/mark-notification-read.usecase';
import { RegisterDeviceTokenUseCase } from './application/usecases/register-device-token.usecase';
import { NotificationRepository } from './domain/repositories/notification.repository';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { DeviceTokenRepository } from './domain/repositories/device-token.repository';
import { PrismaDeviceTokenRepository } from './infrastructure/repositories/prisma-device-token.repository';
import { FcmService } from './infrastructure/fcm.service';

@Module({
  controllers: [NotificationController, DeviceTokenController],
  providers: [
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    MarkNotificationReadUseCase,
    RegisterDeviceTokenUseCase,
    FcmService,
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
    { provide: DeviceTokenRepository, useClass: PrismaDeviceTokenRepository },
  ],
  exports: [CreateNotificationUseCase, DeviceTokenRepository, FcmService], // FcmService for the alert checker
})
export class NotificationsModule {}
