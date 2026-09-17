// C:\omnisift_final\apps\backend\src\modules\notifications\domain\repositories\notification.repository.ts
import { Notification, NotificationType } from '../entities/notification.entity';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}

export abstract class NotificationRepository {
  abstract create(input: CreateNotificationInput): Promise<Notification>;
  abstract list(userId: string, unreadOnly: boolean): Promise<Notification[]>;
  abstract unreadCount(userId: string): Promise<number>;
  abstract markRead(userId: string, id: string): Promise<Notification | null>;
  abstract markAllRead(userId: string): Promise<number>;
}
