// C:\omnisift_final\apps\backend\src\modules\notifications\application\usecases\create-notification.usecase.ts
import { Injectable } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import {
  CreateNotificationInput,
  NotificationRepository,
} from '../../domain/repositories/notification.repository';

@Injectable()
export class CreateNotificationUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  execute(input: CreateNotificationInput): Promise<Notification> {
    return this.repo.create(input);
  }
}
