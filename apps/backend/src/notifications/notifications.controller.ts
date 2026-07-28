import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NotificationsService, CreateNotificationDTO, NotificationType } from './notifications.service';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications?unread=true&type=reminder */
  @Get()
  findAll(
    @CurrentUser() user: ZenithUser,
    @Query('unread') unread?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.max(1, Math.min(100, parseInt(limit, 10))) : 50;
    return this.notificationsService.findAll(
      user.id,
      unread === 'true',
      type as NotificationType | undefined,
      parsedLimit,
    );
  }

  /** GET /notifications/count — usado pelo badge do sino */
  @Get('count')
  count(@CurrentUser() user: ZenithUser) {
    return this.notificationsService.count(user.id);
  }

  /** POST /notifications/auto-check — dispara verificações de rotinas e cria lembretes */
  @Post('auto-check')
  autoCheck(@CurrentUser() user: ZenithUser) {
    return this.notificationsService.notifyTodaysRoutines(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.notificationsService.findOne(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: ZenithUser, @Body() dto: CreateNotificationDTO) {
    return this.notificationsService.create(user.id, dto);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: ZenithUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }

  @Delete('clear')
  clearAll(@CurrentUser() user: ZenithUser) {
    return this.notificationsService.clearAll(user.id);
  }
}
