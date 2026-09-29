import { Module } from '@nestjs/common';
import { InAppNotificationProvider, NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({ controllers: [NotificationsController], providers: [InAppNotificationProvider, NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
