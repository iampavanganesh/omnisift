// C:\omnisift_final\apps\backend\src\modules\notifications\presentation\controllers\notification.controller.ts
import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { MarkedResultDto, NotificationMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { JwtAuthGuard, type AuthUser } from '../../../../core/security/jwt-auth.guard';
import { CurrentUser } from '../../../../core/security/current-user.decorator';
import { GetNotificationsUseCase } from '../../application/usecases/get-notifications.usecase';
import { MarkNotificationReadUseCase } from '../../application/usecases/mark-notification-read.usecase';
import { NotificationResponseDto } from '../../application/dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly getUseCase: GetNotificationsUseCase,
    private readonly readUseCase: MarkNotificationReadUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List the signed-in user's notifications",
    description:
      'Requires authentication. meta.unreadCount is the total unread count regardless of the unread filter.',
  })
  @ApiQuery({
    name: 'unread',
    required: false,
    schema: { type: 'string' },
    description:
      "Pass 'true' or '1' to return only unread items. Any other value is treated as false; not schema-validated.",
  })
  @ApiEnvelopeOk(NotificationResponseDto, { isArray: true, meta: NotificationMetaDto })
  @ApiErrors('auth')
  async list(@CurrentUser() user: AuthUser, @Query('unread') unread?: string) {
    const unreadOnly = unread === 'true' || unread === '1';
    const items = await this.getUseCase.execute(user.id, unreadOnly);
    const unreadCount = await this.getUseCase.count(user.id);
    return ApiResponse.ok(
      items.map((n) => NotificationResponseDto.from(n)),
      { unreadCount },
    );
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark every notification as read',
    description: 'Requires authentication.',
  })
  @ApiEnvelopeOk(MarkedResultDto)
  @ApiErrors('auth')
  async readAll(@CurrentUser() user: AuthUser) {
    const count = await this.readUseCase.all(user.id);
    return ApiResponse.ok({ marked: count });
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark one notification as read',
    description: 'Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'Notification id.' })
  @ApiEnvelopeOk(NotificationResponseDto)
  @ApiErrors('auth', 'notFound')
  async read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const n = await this.readUseCase.one(user.id, id);
    return ApiResponse.ok(NotificationResponseDto.from(n));
  }
}
