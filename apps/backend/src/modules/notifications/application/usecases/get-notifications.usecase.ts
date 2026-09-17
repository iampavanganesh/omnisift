// C:\omnisift_final\apps\backend\src\modules\notifications\application\usecases\get-notifications.usecase.ts
import { Injectable } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepository } from '../../domain/repositories/notification.repository';

@Injectable()
export class GetNotificationsUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  execute(userId: string, unreadOnly: boolean): Promise<Notification[]> {
    return this.repo.list(userId, unreadOnly);
  }

  count(userId: string): Promise<number> {
    return this.repo.unreadCount(userId);
  }
}
