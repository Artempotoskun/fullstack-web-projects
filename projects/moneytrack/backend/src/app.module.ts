import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { CategorizationModule } from './modules/categorization/categorization.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ImportsModule } from './modules/imports/imports.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RecurringModule } from './modules/recurring/recurring.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      cache: true,
      validate: (env: Record<string, unknown>) => {
        const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
        const missing = required.filter((key) => !env[key]);
        if (missing.length && env.NODE_ENV !== 'test') throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
          if (typeof env[key] === 'string' && env[key].length < 32 && env.NODE_ENV !== 'test') throw new Error(`${key} must be at least 32 characters`);
        }
        return env;
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new URL(config.get<string>('REDIS_URL', 'redis://localhost:6380'));
        return { connection: { host: redis.hostname, port: Number(redis.port || 6379), username: redis.username || undefined, password: redis.password || undefined } };
      },
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    CategoriesModule,
    CategorizationModule,
    TransactionsModule,
    BudgetsModule,
    GoalsModule,
    RecurringModule,
    ImportsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
