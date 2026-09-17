// C:\omnisift_final\apps\backend\src\modules\notifications\application\usecases\mark-notification-read.usecase.ts
import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../core/errors/app-error';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepository } from '../../domain/repositories/notification.repository';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async one(userId: string, id: string): Promise<Notification> {
    const updated = await this.repo.markRead(userId, id);
    if (!updated) throw new NotFoundError('Notification not found.');
    return updated;
  }

  all(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }
}
