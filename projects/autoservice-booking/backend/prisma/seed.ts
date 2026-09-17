import { BookingStatus, Locale, NotificationType, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const serviceSeed = [
  ['oil-change', 'Maintenance', 79, 60, 'Droplets', 'Oil Change', 'Заміна оливи', 'Замена масла'],
  ['brake-service', 'Brakes', 169, 90, 'Disc3', 'Brake Service', 'Сервіс гальм', 'Сервис тормозов'],
  ['diagnostics', 'Diagnostics', 59, 60, 'ScanLine', 'Computer Diagnostics', "Комп'ютерна діагностика", 'Компьютерная диагностика'],
  ['engine-repair', 'Engine', 449, 180, 'Settings', 'Engine Repair', 'Ремонт двигуна', 'Ремонт двигателя'],
  ['suspension', 'Chassis', 189, 120, 'Gauge', 'Suspension Service', 'Ремонт підвіски', 'Ремонт подвески'],
  ['tire-service', 'Tires', 89, 60, 'CircleDot', 'Tire Service', 'Шиномонтаж', 'Шиномонтаж'],
  ['wheel-alignment', 'Chassis', 99, 60, 'MoveHorizontal', 'Wheel Alignment', 'Розвал-сходження', 'Развал-схождение'],
  ['battery-replacement', 'Electrical', 49, 30, 'BatteryCharging', 'Battery Replacement', 'Заміна акумулятора', 'Замена аккумулятора'],
  ['air-conditioning', 'Climate', 119, 90, 'Snowflake', 'Air Conditioning', 'Кондиціонер', 'Кондиционер'],
  ['transmission-service', 'Transmission', 249, 120, 'Workflow', 'Transmission Service', 'Сервіс трансмісії', 'Сервис трансмиссии'],
  ['electrical-diagnostics', 'Electrical', 89, 90, 'Zap', 'Electrical Diagnostics', 'Діагностика електрики', 'Диагностика электрики'],
  ['pre-purchase-inspection', 'Inspection', 129, 120, 'ClipboardCheck', 'Pre-Purchase Inspection', 'Перевірка перед купівлею', 'Проверка перед покупкой'],
] as const;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedPeriod.deleteMany();
  await prisma.specialWorkingDay.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.mechanicService.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.serviceBay.deleteMany();
  await prisma.locationService.deleteMany();
  await prisma.serviceTranslation.deleteMany();
  await prisma.service.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  const userPassword = await hash(process.env.SEED_USER_PASSWORD ?? 'UserDemo123!', 12);
  const adminPassword = await hash(process.env.SEED_ADMIN_PASSWORD ?? 'AdminDemo123!', 12);
  const user = await prisma.user.create({ data: { email: 'user@autoservice.demo', passwordHash: userPassword, firstName: 'Alex', lastName: 'Driver', phone: '+380 67 555 01 01', role: Role.USER, locale: Locale.EN } });
  const secondUser = await prisma.user.create({ data: { email: 'maria@autoservice.demo', passwordHash: userPassword, firstName: 'Maria', lastName: 'Koval', phone: '+380 67 555 01 02', role: Role.USER, locale: Locale.UK } });
  const admin = await prisma.user.create({ data: { email: 'admin@autoservice.demo', passwordHash: adminPassword, firstName: 'Service', lastName: 'Manager', phone: '+380 44 555 01 00', role: Role.ADMIN, locale: Locale.EN } });

  const [center, riverside] = await Promise.all([
    prisma.location.create({ data: { slug: 'central-workshop', name: 'AutoService Central', address: '12 Peremohy Avenue, Kyiv', phone: '+380 44 555 11 22', latitude: 50.45466, longitude: 30.5038 } }),
    prisma.location.create({ data: { slug: 'riverside-workshop', name: 'AutoService Riverside', address: '84 Naberezhne Highway, Kyiv', phone: '+380 44 555 33 44', latitude: 50.4234, longitude: 30.5671 } }),
  ]);

  for (const location of [center, riverside]) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const sunday = weekday === 0; const saturday = weekday === 6;
      await prisma.businessHours.create({ data: { locationId: location.id, weekday, isClosed: sunday, openTime: sunday ? null : saturday ? '10:00' : '09:00', closeTime: sunday ? null : saturday ? '16:00' : '18:00' } });
    }
  }

  const services = [];
  for (const [slug, category, price, durationMinutes, icon, en, uk, ru] of serviceSeed) {
    services.push(await prisma.service.create({ data: {
      slug, category, price, durationMinutes, icon,
      translations: { create: [
        { locale: Locale.EN, name: en, description: `Professional ${en.toLowerCase()} with transparent inspection results and parts recommendations.` },
        { locale: Locale.UK, name: uk, description: `Професійна послуга «${uk}» з прозорими результатами огляду та рекомендаціями.` },
        { locale: Locale.RU, name: ru, description: `Профессиональная услуга «${ru}» с прозрачными результатами осмотра и рекомендациями.` },
      ] },
      locations: { create: [{ locationId: center.id }, { locationId: riverside.id }] },
    } }));
  }

  const mechanicData = [
    [center.id, 'Daniel Kovalenko', 'Diagnostics & electrical'],
    [center.id, 'Oleh Marchenko', 'Engine & transmission'],
    [center.id, 'Iryna Bondar', 'Chassis & brakes'],
    [riverside.id, 'Maksym Tkachenko', 'Maintenance & tires'],
    [riverside.id, 'Anna Shevchenko', 'Diagnostics & climate'],
  ] as const;
  const mechanics = [];
  for (const [locationId, name, specialization] of mechanicData) {
    mechanics.push(await prisma.mechanic.create({ data: { locationId, name, specialization, services: { create: services.map((service) => ({ serviceId: service.id })) } } }));
  }

  const bays = [];
  for (const location of [center, riverside]) {
    for (const [name, bayType] of [['Bay 01', 'General'], ['Bay 02', 'Lift'], ['Diagnostics Lab', 'Diagnostics']] as const) {
      bays.push(await prisma.serviceBay.create({ data: { locationId: location.id, name, bayType } }));
    }
  }

  const vehicleData = [
    [user.id, 'Ford', 'Fiesta', 2019, '1.6', 'AA 1010 AA', 68400],
    [user.id, 'Volkswagen', 'Golf', 2021, '1.5 TSI', 'KA 2020 BB', 41200],
    [user.id, 'BMW', '3 Series', 2018, '2.0d', 'KA 3300 CC', 89200],
    [secondUser.id, 'Ford', 'Focus', 2020, '1.5 EcoBoost', 'AI 4040 DD', 53700],
    [secondUser.id, 'Skoda', 'Octavia', 2022, '1.4 TSI', 'KA 5050 EE', 28900],
    [secondUser.id, 'Toyota', 'Corolla', 2019, '1.8 Hybrid', 'AA 6060 FF', 74100],
  ] as const;
  const vehicles = [];
  for (const [userId, make, model, year, engine, licensePlate, mileage] of vehicleData) vehicles.push(await prisma.vehicle.create({ data: { userId, make, model, year, engine, licensePlate, mileage } }));

  let created = 0;
  for (let dayOffset = -10; dayOffset < 12; dayOffset += 1) {
    const day = new Date(); day.setUTCHours(0, 0, 0, 0); day.setUTCDate(day.getUTCDate() + dayOffset);
    if (day.getUTCDay() === 0) continue;
    for (let slotIndex = 0; slotIndex < 2; slotIndex += 1) {
      const location = (created + slotIndex) % 2 === 0 ? center : riverside;
      const eligibleMechanics = mechanics.filter((mechanic) => mechanic.locationId === location.id);
      const eligibleBays = bays.filter((bay) => bay.locationId === location.id);
      const service = services[created % services.length];
      const vehicle = vehicles[created % vehicles.length];
      const startTime = new Date(day); startTime.setUTCHours(slotIndex === 0 ? 10 : 14, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + service.durationMinutes * 60_000);
      const status = dayOffset < -2 ? BookingStatus.COMPLETED : dayOffset < 0 ? BookingStatus.CANCELLED : dayOffset < 3 ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
      const booking = await prisma.booking.create({ data: {
        reference: `AS-DEMO-${String(created + 1).padStart(3, '0')}`, userId: vehicle.userId, vehicleId: vehicle.id, serviceId: service.id, locationId: location.id,
        mechanicId: eligibleMechanics[slotIndex % eligibleMechanics.length].id, serviceBayId: eligibleBays[slotIndex % eligibleBays.length].id,
        startTime, endTime, status, quotedPrice: service.price,
        ...(status === BookingStatus.CANCELLED ? { cancelledAt: new Date(startTime.getTime() - 86_400_000), cancellationReason: 'Customer plans changed' } : {}),
        statusHistory: { create: { status, changedBy: admin.id } },
      } });
      await prisma.notification.create({ data: { userId: vehicle.userId, bookingId: booking.id, type: status === BookingStatus.CANCELLED ? NotificationType.BOOKING_CANCELLED : status === BookingStatus.COMPLETED ? NotificationType.BOOKING_COMPLETED : NotificationType.BOOKING_CONFIRMED, title: `Booking ${status.toLowerCase()}`, message: `${booking.reference} · ${startTime.toISOString()}`, isRead: dayOffset < 0 } });
      created += 1;
    }
  }

  await prisma.specialWorkingDay.create({ data: { locationId: center.id, date: new Date('2027-01-01T00:00:00.000Z'), isClosed: true, note: 'New Year holiday' } });
  console.log(`Seeded ${services.length} services, 2 locations, ${mechanics.length} mechanics, ${bays.length} bays and ${created} bookings.`);
}

main().finally(() => prisma.$disconnect());
