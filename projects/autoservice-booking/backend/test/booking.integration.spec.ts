import { ConflictException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, Locale, NotificationType, PrismaClient, Role } from '@prisma/client';
import { AuditService } from '../src/common/services/audit.service';
import { AvailabilityService } from '../src/modules/availability/availability.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { InAppNotificationProvider, NotificationsService } from '../src/modules/notifications/notifications.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { VehiclesService } from '../src/modules/vehicles/vehicles.service';

describe('Booking engine PostgreSQL integration', () => {
  const prisma = new PrismaService();
  const vehicles = new VehiclesService(prisma);
  const availability = new AvailabilityService(prisma);
  const notifications = new NotificationsService(prisma, new InAppNotificationProvider(prisma));
  const bookings = new BookingsService(prisma, vehicles, availability, notifications, new AuditService(prisma));
  let userId: string;
  let otherUserId: string;
  let vehicleId: string;
  let serviceId: string;
  let locationId: string;
  let slot: Date;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes('autoservice_test')) throw new Error('Integration tests require an isolated autoservice_test DATABASE_URL');
    await prisma.$connect();
    await clean(prisma);
    const user = await prisma.user.create({ data: { email: 'concurrency@test.local', passwordHash: 'not-used', firstName: 'Test', lastName: 'Driver', locale: Locale.EN, role: Role.USER } });
    const other = await prisma.user.create({ data: { email: 'other@test.local', passwordHash: 'not-used', firstName: 'Other', lastName: 'Driver' } });
    userId = user.id; otherUserId = other.id;
    const vehicle = await prisma.vehicle.create({ data: { userId, make: 'Ford', model: 'Fiesta', year: 2019, engine: '1.6', mileage: 50000 } }); vehicleId = vehicle.id;
    const location = await prisma.location.create({ data: { slug: 'test-location', name: 'Test Workshop', address: 'Test', phone: '+000' } }); locationId = location.id;
    for (let weekday = 0; weekday < 7; weekday += 1) await prisma.businessHours.create({ data: { locationId, weekday, openTime: '08:00', closeTime: '20:00', isClosed: false } });
    const service = await prisma.service.create({ data: { slug: 'test-service', category: 'Test', price: 100, durationMinutes: 60, translations: { create: { locale: Locale.EN, name: 'Test Service', description: 'Test' } }, locations: { create: { locationId } } } }); serviceId = service.id;
    const mechanic = await prisma.mechanic.create({ data: { locationId, name: 'Only Mechanic', specialization: 'All', services: { create: { serviceId } } } });
    await prisma.serviceBay.create({ data: { locationId, name: 'Only Bay', bayType: 'General' } });
    slot = nextFutureWeekdayAtTen();
    expect(mechanic.id).toBeTruthy();
  });

  afterAll(async () => { await clean(prisma); await prisma.$disconnect(); });

  it('rejects vehicle access across user boundaries', async () => {
    await expect(vehicles.assertOwner(otherUserId, vehicleId)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows only one of two concurrent requests for the last slot', async () => {
    const dto = { vehicleId, serviceId, locationId, startTime: slot.toISOString() };
    const results = await Promise.allSettled([bookings.create(userId, dto), bookings.create(userId, dto)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect((results.find((result) => result.status === 'rejected') as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
    expect(await prisma.booking.count({ where: { startTime: slot } })).toBe(1);
  });

  it('reschedules atomically and frees the old slot, then records cancellation', async () => {
    const current = await prisma.booking.findFirstOrThrow({ where: { startTime: slot } });
    const newStart = new Date(slot.getTime() + 2 * 60 * 60_000);
    const moved = await bookings.reschedule(current.id, userId, Role.USER, { startTime: newStart.toISOString() });
    expect(moved.startTime).toEqual(newStart);
    expect(moved.status).toBe(BookingStatus.PENDING);
    const cancelled = await bookings.cancel(current.id, { id: userId, role: Role.USER }, { reason: 'Plans changed' });
    expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    expect(cancelled.cancelledAt).toBeTruthy();
    expect(await prisma.notification.count({ where: { bookingId: current.id, type: NotificationType.BOOKING_CANCELLED } })).toBe(1);
  });
});

function nextFutureWeekdayAtTen() {
  const date = new Date(Date.now() + 3 * 86_400_000); date.setUTCHours(10, 0, 0, 0);
  while (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

async function clean(prisma: PrismaClient) {
  await prisma.auditLog.deleteMany(); await prisma.notification.deleteMany(); await prisma.bookingStatusHistory.deleteMany(); await prisma.booking.deleteMany(); await prisma.blockedPeriod.deleteMany(); await prisma.specialWorkingDay.deleteMany(); await prisma.businessHours.deleteMany(); await prisma.mechanicService.deleteMany(); await prisma.mechanic.deleteMany(); await prisma.serviceBay.deleteMany(); await prisma.locationService.deleteMany(); await prisma.serviceTranslation.deleteMany(); await prisma.service.deleteMany(); await prisma.vehicle.deleteMany(); await prisma.user.deleteMany(); await prisma.location.deleteMany();
}
