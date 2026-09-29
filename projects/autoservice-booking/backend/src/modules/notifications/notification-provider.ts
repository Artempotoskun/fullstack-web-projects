import { NotificationType } from '@prisma/client';

export interface NotificationPayload {
  userId: string;
  bookingId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}
