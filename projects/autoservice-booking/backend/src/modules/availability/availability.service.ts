import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const activeStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
type ResourceDb = Pick<Prisma.TransactionClient, 'mechanic' | 'serviceBay' | 'booking' | 'blockedPeriod'>;

export interface AllocatedResources { mechanicId: string; serviceBayId: string }

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function slotsBetween(date: string, openTime: string, closeTime: string, durationMinutes: number, stepMinutes = 30) {
  const start = new Date(`${date}T${openTime}:00.000Z`);
  const close = new Date(`${date}T${closeTime}:00.000Z`);
  const slots: Date[] = [];
  for (let cursor = start.getTime(); cursor + durationMinutes * 60_000 <= close.getTime(); cursor += stepMinutes * 60_000) slots.push(new Date(cursor));
  return slots;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(serviceId: string, locationId: string, date: string, vehicleId?: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Date must use YYYY-MM-DD');
    if (vehicleId && !(await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } }))) throw new NotFoundException('Vehicle not found');
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, isActive: true, locations: { some: { locationId, isActive: true } } }, select: { id: true, durationMinutes: true } });
    if (!service) throw new NotFoundException('Service is not available at this location');
    const schedule = await this.scheduleFor(locationId, date);
    if (!schedule || schedule.isClosed || !schedule.openTime || !schedule.closeTime) return { date, state: 'UNAVAILABLE', slots: [] };

    const nowCutoff = Date.now() + 30 * 60_000;
    const candidates = slotsBetween(date, schedule.openTime, schedule.closeTime, service.durationMinutes).filter((slot) => slot.getTime() > nowCutoff);
    const slots = [];
    for (const start of candidates) {
      const end = new Date(start.getTime() + service.durationMinutes * 60_000);
      const resources = await this.resolveResources(this.prisma, locationId, serviceId, start, end);
      if (resources) slots.push({ startTime: start.toISOString(), endTime: end.toISOString(), label: start.toISOString().slice(11, 16) });
    }
    return { date, state: slots.length ? 'AVAILABLE' : 'FULLY_BOOKED', durationMinutes: service.durationMinutes, slots };
  }

  async calendar(serviceId: string, locationId: string, from: Date, to: Date) {
    const days: { date: string; state: string; availableSlots: number }[] = [];
    for (let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); cursor <= to && days.length < 62; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10);
      const result = await this.getAvailability(serviceId, locationId, date);
      days.push({ date, state: result.state, availableSlots: result.slots.length });
    }
    return days;
  }

  async assertWithinBusinessHours(locationId: string, start: Date, end: Date) {
    const date = start.toISOString().slice(0, 10);
    const schedule = await this.scheduleFor(locationId, date);
    if (!schedule || schedule.isClosed || !schedule.openTime || !schedule.closeTime) throw new BadRequestException('Location is closed on the selected date');
    const open = new Date(`${date}T${schedule.openTime}:00.000Z`);
    const close = new Date(`${date}T${schedule.closeTime}:00.000Z`);
    if (start < open || end > close || start.toISOString().slice(0, 10) !== end.toISOString().slice(0, 10)) throw new BadRequestException('Selected time is outside business hours');
  }

  async resolveResources(db: ResourceDb, locationId: string, serviceId: string, start: Date, end: Date, excludeBookingId?: string): Promise<AllocatedResources | null> {
    const [mechanics, bays, bookings, blocks] = await Promise.all([
      db.mechanic.findMany({ where: { locationId, isActive: true, services: { some: { serviceId } } }, select: { id: true } }),
      db.serviceBay.findMany({ where: { locationId, isActive: true }, select: { id: true } }),
      db.booking.findMany({ where: { locationId, status: { in: activeStatuses }, startTime: { lt: end }, endTime: { gt: start }, ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}) }, select: { mechanicId: true, serviceBayId: true } }),
      db.blockedPeriod.findMany({ where: { locationId, startTime: { lt: end }, endTime: { gt: start } }, select: { mechanicId: true, serviceBayId: true } }),
    ]);
    if (blocks.some((block) => !block.mechanicId && !block.serviceBayId)) return null;
    const busyMechanics = new Set([...bookings.map((item) => item.mechanicId).filter(Boolean), ...blocks.map((item) => item.mechanicId).filter(Boolean)]);
    const busyBays = new Set([...bookings.map((item) => item.serviceBayId), ...blocks.map((item) => item.serviceBayId).filter(Boolean)]);
    const mechanic = mechanics.find((item) => !busyMechanics.has(item.id));
    const bay = bays.find((item) => !busyBays.has(item.id));
    return mechanic && bay ? { mechanicId: mechanic.id, serviceBayId: bay.id } : null;
  }

  private async scheduleFor(locationId: string, date: string) {
    const day = new Date(`${date}T00:00:00.000Z`);
    const next = new Date(day.getTime() + 86_400_000);
    const special = await this.prisma.specialWorkingDay.findFirst({ where: { locationId, date: { gte: day, lt: next } } });
    if (special) return special;
    return this.prisma.businessHours.findUnique({ where: { locationId_weekday: { locationId, weekday: day.getUTCDay() } } });
  }
}
