// C:\omnisift_final\apps\backend\src\modules\notifications\domain\entities\notification.entity.ts
export type NotificationType = 'PRICE_DROP' | 'ALERT_TRIGGERED' | 'SYSTEM';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly body: string,
    public readonly data: Record<string, unknown> | null,
    public readonly isRead: boolean,
    public readonly createdAt: Date,
    public readonly readAt: Date | null,
  ) {}
}
