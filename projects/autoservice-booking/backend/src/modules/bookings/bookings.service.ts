import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, NotificationType, Prisma, Role } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../../common/services/audit.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { canCustomerChange, canTransition } from './booking-policy';
import { AssignBookingDto, CancelBookingDto, ChangeBookingStatusDto, CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';

const detailInclude = {
  vehicle: true,
  service: { include: { translations: true } },
  location: true,
  mechanic: true,
  serviceBay: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
} as const;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  listMine(userId: string) { return this.prisma.booking.findMany({ where: { userId }, include: detailInclude, orderBy: { startTime: 'desc' } }); }

  listAdmin(filters: { from?: string; to?: string; locationId?: string; mechanicId?: string; serviceId?: string; status?: BookingStatus }) {
    return this.prisma.booking.findMany({
      where: {
        ...(filters.from || filters.to ? { startTime: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } } : {}),
        ...(filters.locationId ? { locationId: filters.locationId } : {}),
        ...(filters.mechanicId ? { mechanicId: filters.mechanicId } : {}),
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: detailInclude,
      orderBy: { startTime: 'asc' },
      take: 500,
    });
  }

  async getOne(id: string, actor: { id: string; role: Role }) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: detailInclude });
    if (!booking) throw new NotFoundException('Booking not found');
    if (actor.role !== Role.ADMIN && booking.userId !== actor.id) throw new ForbiddenException('Booking does not belong to this user');
    return booking;
  }

  async create(userId: string, dto: CreateBookingDto, actorId = userId) {
    await this.vehicles.assertOwner(userId, dto.vehicleId);
    const service = await this.prisma.service.findFirst({ where: { id: dto.serviceId, isActive: true, locations: { some: { locationId: dto.locationId, isActive: true } } } });
    if (!service) throw new NotFoundException('Service is not available at this location');
    const start = new Date(dto.startTime);
    if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now() + 15 * 60_000) throw new BadRequestException('Booking must be in the future');
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);
    await this.availability.assertWithinBusinessHours(dto.locationId, start, end);

    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const lockKey = `${dto.locationId}:${start.toISOString().slice(0, 10)}`;
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text AS lock`;
        const resources = await this.availability.resolveResources(tx, dto.locationId, dto.serviceId, start, end);
        if (!resources) throw new ConflictException('The selected slot is no longer available');
        return tx.booking.create({
          data: {
            reference: this.reference(), userId, vehicleId: dto.vehicleId, serviceId: dto.serviceId, locationId: dto.locationId,
            mechanicId: resources.mechanicId, serviceBayId: resources.serviceBayId, startTime: start, endTime: end,
            quotedPrice: service.price, customerNotes: dto.customerNotes,
            statusHistory: { create: { status: BookingStatus.PENDING, changedBy: actorId } },
          },
          include: detailInclude,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      await this.notifications.sendBookingEvent({ userId, bookingId: booking.id, type: NotificationType.BOOKING_CREATED, reference: booking.reference, startTime: booking.startTime });
      return booking;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2004', 'P2034'].includes(error.code)) throw new ConflictException('The selected slot was booked by another request');
      throw error;
    }
  }

  async reschedule(id: string, userId: string, role: Role, dto: RescheduleBookingDto) {
    const existing = await this.getOne(id, { id: userId, role });
    if (!canCustomerChange(existing.status) && role !== Role.ADMIN) throw new BadRequestException('This booking can no longer be rescheduled');
    const start = new Date(dto.startTime);
    if (start.getTime() < Date.now() + 15 * 60_000) throw new BadRequestException('Booking must be in the future');
    const end = new Date(start.getTime() + existing.service.durationMinutes * 60_000);
    await this.availability.assertWithinBusinessHours(existing.locationId, start, end);
    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const lockKey = `${existing.locationId}:${start.toISOString().slice(0, 10)}`;
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text AS lock`;
        const resources = await this.availability.resolveResources(tx, existing.locationId, existing.serviceId, start, end, id);
        if (!resources) throw new ConflictException('The selected slot is no longer available');
        return tx.booking.update({ where: { id }, data: { startTime: start, endTime: end, ...resources, status: BookingStatus.PENDING, statusHistory: { create: { status: BookingStatus.PENDING, changedBy: userId, note: 'Booking rescheduled' } } }, include: detailInclude });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      await this.notifications.sendBookingEvent({ userId: booking.userId, bookingId: booking.id, type: NotificationType.BOOKING_RESCHEDULED, reference: booking.reference, startTime: booking.startTime });
      if (role === Role.ADMIN) await this.audit.record({ actorId: userId, action: 'BOOKING_RESCHEDULED', entityType: 'Booking', entityId: id, metadata: { startTime: dto.startTime } });
      return booking;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2004', 'P2034'].includes(error.code)) throw new ConflictException('The selected slot was booked by another request');
      throw error;
    }
  }

  async cancel(id: string, actor: { id: string; role: Role }, dto: CancelBookingDto) {
    const existing = await this.getOne(id, actor);
    if (!canCustomerChange(existing.status) && actor.role !== Role.ADMIN) throw new BadRequestException('This booking can no longer be cancelled');
    if (existing.status === BookingStatus.CANCELLED || existing.status === BookingStatus.COMPLETED) throw new BadRequestException('Booking is already closed');
    const booking = await this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: dto.reason, statusHistory: { create: { status: BookingStatus.CANCELLED, changedBy: actor.id, note: dto.reason } } }, include: detailInclude });
    await this.notifications.sendBookingEvent({ userId: booking.userId, bookingId: booking.id, type: NotificationType.BOOKING_CANCELLED, reference: booking.reference, startTime: booking.startTime });
    if (actor.role === Role.ADMIN) await this.audit.record({ actorId: actor.id, action: 'BOOKING_CANCELLED', entityType: 'Booking', entityId: id, metadata: { reason: dto.reason } });
    return booking;
  }

  async changeStatus(id: string, adminId: string, dto: ChangeBookingStatusDto) {
    const current = await this.prisma.booking.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Booking not found');
    if (!canTransition(current.status, dto.status)) throw new BadRequestException(`Invalid transition from ${current.status} to ${dto.status}`);
    const booking = await this.prisma.booking.update({ where: { id }, data: { status: dto.status, ...(dto.status === BookingStatus.CANCELLED ? { cancelledAt: new Date(), cancellationReason: dto.note ?? 'Cancelled by administrator' } : {}), statusHistory: { create: { status: dto.status, changedBy: adminId, note: dto.note } } }, include: detailInclude });
    const notificationType = dto.status === BookingStatus.CONFIRMED ? NotificationType.BOOKING_CONFIRMED : dto.status === BookingStatus.COMPLETED ? NotificationType.BOOKING_COMPLETED : dto.status === BookingStatus.CANCELLED ? NotificationType.BOOKING_CANCELLED : null;
    if (notificationType) await this.notifications.sendBookingEvent({ userId: booking.userId, bookingId: booking.id, type: notificationType, reference: booking.reference, startTime: booking.startTime });
    await this.audit.record({ actorId: adminId, action: 'BOOKING_STATUS_CHANGED', entityType: 'Booking', entityId: id, metadata: { from: current.status, to: dto.status, note: dto.note } });
    return booking;
  }

  async assign(id: string, adminId: string, dto: AssignBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (dto.mechanicId) {
      const mechanic = await this.prisma.mechanic.findFirst({ where: { id: dto.mechanicId, locationId: booking.locationId, isActive: true, services: { some: { serviceId: booking.serviceId } } } });
      if (!mechanic) throw new BadRequestException('Mechanic cannot perform this service');
      const collision = await this.prisma.booking.count({ where: { id: { not: id }, mechanicId: dto.mechanicId, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] }, startTime: { lt: booking.endTime }, endTime: { gt: booking.startTime } } });
      if (collision) throw new ConflictException('Mechanic is busy during this booking');
    }
    if (dto.serviceBayId) {
      const bay = await this.prisma.serviceBay.findFirst({ where: { id: dto.serviceBayId, locationId: booking.locationId, isActive: true } });
      if (!bay) throw new BadRequestException('Service bay is not available at this location');
      const collision = await this.prisma.booking.count({ where: { id: { not: id }, serviceBayId: dto.serviceBayId, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] }, startTime: { lt: booking.endTime }, endTime: { gt: booking.startTime } } });
      if (collision) throw new ConflictException('Service bay is busy during this booking');
    }
    const updated = await this.prisma.booking.update({ where: { id }, data: dto, include: detailInclude });
    await this.audit.record({ actorId: adminId, action: 'BOOKING_ASSIGNMENT_CHANGED', entityType: 'Booking', entityId: id, metadata: { ...dto } });
    return updated;
  }

  private reference() { return `AS-${new Date().getUTCFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`; }
}
