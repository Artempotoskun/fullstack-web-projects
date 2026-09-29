import { Injectable } from '@nestjs/common';
import { Locale, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPayload, NotificationProvider } from './notification-provider';

@Injectable()
export class InAppNotificationProvider implements NotificationProvider {
  constructor(private readonly prisma: PrismaService) {}
  async send(payload: NotificationPayload) { await this.prisma.notification.create({ data: payload }); }
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly inApp: InAppNotificationProvider) {}
  list(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  unreadCount(userId: string) { return this.prisma.notification.count({ where: { userId, isRead: false } }).then((count) => ({ count })); }
  async markRead(userId: string, id: string) { await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }); return { success: true }; }
  async sendBookingEvent(input: { userId: string; bookingId: string; type: NotificationType; reference: string; startTime: Date }) {
    const user = await this.prisma.user.findUnique({ where: { id: input.userId }, select: { locale: true } });
    const copy: Record<Locale, Record<NotificationType, string>> = {
      EN: { BOOKING_CREATED: 'Booking created', BOOKING_CONFIRMED: 'Booking confirmed', BOOKING_RESCHEDULED: 'Booking rescheduled', BOOKING_CANCELLED: 'Booking cancelled', BOOKING_REMINDER: 'Upcoming booking reminder', BOOKING_COMPLETED: 'Booking completed' },
      UK: { BOOKING_CREATED: 'Запис створено', BOOKING_CONFIRMED: 'Запис підтверджено', BOOKING_RESCHEDULED: 'Запис перенесено', BOOKING_CANCELLED: 'Запис скасовано', BOOKING_REMINDER: 'Нагадування про запис', BOOKING_COMPLETED: 'Обслуговування завершено' },
      RU: { BOOKING_CREATED: 'Запись создана', BOOKING_CONFIRMED: 'Запись подтверждена', BOOKING_RESCHEDULED: 'Запись перенесена', BOOKING_CANCELLED: 'Запись отменена', BOOKING_REMINDER: 'Напоминание о записи', BOOKING_COMPLETED: 'Обслуживание завершено' },
    };
    const locale = user?.locale ?? Locale.EN;
    return this.inApp.send({ userId: input.userId, bookingId: input.bookingId, type: input.type, title: copy[locale][input.type], message: `${input.reference} · ${input.startTime.toISOString()}` });
  }
}
