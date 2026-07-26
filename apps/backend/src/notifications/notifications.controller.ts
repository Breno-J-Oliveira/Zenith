import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NotificationsService, CreateNotificationDTO } from './notifications.service';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications?unread=true */
  @Get()
  findAll(@CurrentUser() user: ZenithUser, @Query('unread') unread?: string) {
    return this.notificationsService.findAll(user.id, unread === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.notificationsService.findOne(user.id, id);
  }

  @Post()
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

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  clearAll(@CurrentUser() user: ZenithUser) {
    return this.notificationsService.clearAll(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
