import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({ imports: [VehiclesModule, AvailabilityModule, NotificationsModule], controllers: [BookingsController], providers: [BookingsService, AuditService], exports: [BookingsService] })
export class BookingsModule {}
