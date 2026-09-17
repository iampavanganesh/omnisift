// C:\omnisift_final\apps\backend\src\modules\notifications\infrastructure\repositories\prisma-notification.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { Notification, NotificationType } from '../../domain/entities/notification.entity';
import {
  CreateNotificationInput,
  NotificationRepository,
} from '../../domain/repositories/notification.repository';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return this.toEntity(row);
  }

  async list(userId: string, unreadOnly: boolean): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toEntity(r));
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    const res = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    if (res.count === 0) return null;
    const row = await this.prisma.notification.findFirst({ where: { id, userId } });
    return row ? this.toEntity(row) : null;
  }

  async markAllRead(userId: string): Promise<number> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return res.count;
  }

  private toEntity(r: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data: unknown;
    isRead: boolean;
    createdAt: Date;
    readAt: Date | null;
  }): Notification {
    return new Notification(
      r.id,
      r.userId,
      r.type as NotificationType,
      r.title,
      r.body,
      (r.data as Record<string, unknown> | null) ?? null,
      r.isRead,
      r.createdAt,
      r.readAt,
    );
  }
}
