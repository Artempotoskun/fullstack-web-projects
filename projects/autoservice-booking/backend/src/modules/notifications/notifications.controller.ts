import { Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.notifications.list(user.id); }
  @Get('unread-count') count(@CurrentUser() user: AuthUser) { return this.notifications.unreadCount(user.id); }
  @Patch(':id/read') read(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.notifications.markRead(user.id, id); }
}
