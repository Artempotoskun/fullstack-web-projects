import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { AuditService } from '../../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBayDto, CreateBlockedPeriodDto, CreateMechanicDto, CreateServiceDto, UpdateBusinessHoursDto, UpdateServiceDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async dashboard() {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const [todayBookings, upcoming, completed, cancelled, users, revenue, popular, workload] = await Promise.all([
      this.prisma.booking.count({ where: { startTime: { gte: today, lt: tomorrow } } }),
      this.prisma.booking.count({ where: { startTime: { gte: new Date() }, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      this.prisma.user.count(),
      this.prisma.booking.aggregate({ where: { status: BookingStatus.COMPLETED }, _sum: { quotedPrice: true } }),
      this.prisma.booking.groupBy({ by: ['serviceId'], _count: { serviceId: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 }),
      this.prisma.booking.groupBy({ by: ['mechanicId'], where: { mechanicId: { not: null }, startTime: { gte: today, lt: tomorrow }, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } }, _count: { mechanicId: true } }),
    ]);
    const services = await this.prisma.service.findMany({ where: { id: { in: popular.map((item) => item.serviceId) } }, include: { translations: { where: { locale: 'EN' } } } });
    const mechanics = await this.prisma.mechanic.findMany({ where: { id: { in: workload.map((item) => item.mechanicId).filter((id): id is string => Boolean(id)) } } });
    return {
      todayBookings, upcomingBookings: upcoming, completedServices: completed, cancelledBookings: cancelled, users,
      revenueEstimate: revenue._sum.quotedPrice ?? 0,
      popularServices: popular.map((item) => ({ count: item._count.serviceId, service: services.find((service) => service.id === item.serviceId) })),
      mechanicWorkload: workload.map((item) => ({ count: item._count.mechanicId, mechanic: mechanics.find((mechanic) => mechanic.id === item.mechanicId) })),
    };
  }

  resources() {
    return Promise.all([
      this.prisma.mechanic.findMany({ include: { location: true, services: { include: { service: { include: { translations: { where: { locale: 'EN' } } } } } } }, orderBy: { name: 'asc' } }),
      this.prisma.serviceBay.findMany({ include: { location: true }, orderBy: [{ locationId: 'asc' }, { name: 'asc' }] }),
      this.prisma.businessHours.findMany({ include: { location: true }, orderBy: [{ locationId: 'asc' }, { weekday: 'asc' }] }),
      this.prisma.blockedPeriod.findMany({ where: { endTime: { gte: new Date() } }, include: { location: true, mechanic: true, serviceBay: true }, orderBy: { startTime: 'asc' } }),
    ]).then(([mechanics, serviceBays, businessHours, blockedPeriods]) => ({ mechanics, serviceBays, businessHours, blockedPeriods }));
  }

  auditLogs() { return this.prisma.auditLog.findMany({ include: { actor: { select: { email: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }); }

  async createService(adminId: string, dto: CreateServiceDto) {
    const service = await this.prisma.service.create({ data: { slug: dto.slug, category: dto.category, price: dto.price, durationMinutes: dto.durationMinutes, icon: dto.icon, translations: { create: dto.translations }, locations: { create: dto.locationIds.map((locationId) => ({ locationId })) } }, include: { translations: true, locations: true } });
    await this.auditService.record({ actorId: adminId, action: 'SERVICE_CREATED', entityType: 'Service', entityId: service.id }); return service;
  }

  async updateService(adminId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.update({ where: { id }, data: dto });
    await this.auditService.record({ actorId: adminId, action: 'SERVICE_UPDATED', entityType: 'Service', entityId: id, metadata: { ...dto } }); return service;
  }

  async updateHours(adminId: string, locationId: string, dto: UpdateBusinessHoursDto) {
    for (const item of dto.hours) {
      if (!item.isClosed && (!/^\d{2}:\d{2}$/.test(item.openTime ?? '') || !/^\d{2}:\d{2}$/.test(item.closeTime ?? ''))) throw new BadRequestException('Open and close time must use HH:mm');
    }
    await this.prisma.$transaction(dto.hours.map((item) => this.prisma.businessHours.upsert({ where: { locationId_weekday: { locationId, weekday: item.weekday } }, create: { locationId, ...item }, update: item })));
    await this.auditService.record({ actorId: adminId, action: 'BUSINESS_HOURS_UPDATED', entityType: 'Location', entityId: locationId });
    return this.prisma.businessHours.findMany({ where: { locationId }, orderBy: { weekday: 'asc' } });
  }

  async block(adminId: string, dto: CreateBlockedPeriodDto) {
    const startTime = new Date(dto.startTime); const endTime = new Date(dto.endTime);
    if (endTime <= startTime) throw new BadRequestException('Blocked period end must be after start');
    const period = await this.prisma.blockedPeriod.create({ data: { ...dto, startTime, endTime } });
    await this.auditService.record({ actorId: adminId, action: 'BLOCKED_PERIOD_CREATED', entityType: 'BlockedPeriod', entityId: period.id }); return period;
  }

  async createMechanic(adminId: string, dto: CreateMechanicDto) {
    const mechanic = await this.prisma.mechanic.create({ data: { locationId: dto.locationId, name: dto.name, specialization: dto.specialization, services: { create: dto.serviceIds.map((serviceId) => ({ serviceId })) } }, include: { services: true } });
    await this.auditService.record({ actorId: adminId, action: 'MECHANIC_CREATED', entityType: 'Mechanic', entityId: mechanic.id }); return mechanic;
  }

  async createBay(adminId: string, dto: CreateBayDto) {
    const bay = await this.prisma.serviceBay.create({ data: dto });
    await this.auditService.record({ actorId: adminId, action: 'SERVICE_BAY_CREATED', entityType: 'ServiceBay', entityId: bay.id }); return bay;
  }
}
