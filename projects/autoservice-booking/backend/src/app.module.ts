import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      cache: true,
      validate: (env: Record<string, unknown>) => {
        const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
        const missing = required.filter((key) => !env[key]);
        if (missing.length && env.NODE_ENV !== 'test') throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
          if (typeof env[key] === 'string' && env[key].length < 32 && env.NODE_ENV !== 'test') {
            throw new Error(`${key} must be at least 32 characters`);
          }
        }
        return env;
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 150 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    CatalogModule,
    AvailabilityModule,
    NotificationsModule,
    BookingsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [ThrottlerGuard],
})
export class AppModule {}
