// C:\omnisift_final\apps\backend\src\modules\notifications\application\dto\notification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '../../domain/entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiProperty() body!: string;
  @ApiProperty({ nullable: true }) data!: Record<string, unknown> | null;
  @ApiProperty() isRead!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ nullable: true }) readAt!: Date | null;

  static from(n: Notification): NotificationResponseDto {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt,
      readAt: n.readAt,
    };
  }
}
