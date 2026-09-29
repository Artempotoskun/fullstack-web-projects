import { BullModule, InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, OnModuleInit, Param, Patch, Post } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { Currency, Prisma, RecurrenceFrequency, TransactionType } from '@prisma/client';
import { Queue } from 'bullmq';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { nextOccurrence, signedAmount } from '../../domain/finance';
import { PrismaService } from '../prisma/prisma.service';

class RecurringDto {
  @IsUUID() accountId: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsString() @Length(1, 120) name: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
  @IsIn(['UAH', 'USD', 'EUR']) currency: Currency;
  @IsOptional() @IsIn(['INCOME', 'EXPENSE']) type?: TransactionType;
  @IsIn(['WEEKLY', 'MONTHLY', 'YEARLY']) frequency: RecurrenceFrequency;
  @IsDateString() nextExecution: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

class UpdateRecurringDto extends PartialType(RecurringDto) {}

@Injectable()
class RecurringService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, @InjectQueue('recurring-payments') private readonly queue: Queue) {}
  async onModuleInit(): Promise<void> {
    await this.queue.add('process-due', {}, { jobId: 'recurring-scan', repeat: { every: 60 * 60 * 1000 }, removeOnComplete: 20, removeOnFail: 50 });
  }
  list(userId: string) { return this.prisma.recurringPayment.findMany({ where: { userId }, include: { account: true, category: true }, orderBy: { nextExecution: 'asc' } }); }
  create(userId: string, dto: RecurringDto) { return this.prisma.recurringPayment.create({ data: { ...dto, userId, amount: new Prisma.Decimal(dto.amount), nextExecution: new Date(dto.nextExecution) } }); }
  async update(userId: string, id: string, dto: UpdateRecurringDto) { await this.owned(userId, id); return this.prisma.recurringPayment.update({ where: { id }, data: { ...dto, amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined, nextExecution: dto.nextExecution ? new Date(dto.nextExecution) : undefined } }); }
  async remove(userId: string, id: string) { await this.owned(userId, id); await this.prisma.recurringPayment.delete({ where: { id } }); return { deleted: true }; }
  private async owned(userId: string, id: string) { const item = await this.prisma.recurringPayment.findFirst({ where: { id, userId } }); if (!item) throw new NotFoundException('Recurring payment not found'); return item; }
}

@Processor('recurring-payments')
class RecurringProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) { super(); }
  async process(): Promise<{ processed: number }> {
    const now = new Date();
    const due = await this.prisma.recurringPayment.findMany({ where: { enabled: true, nextExecution: { lte: now } } });
    for (const payment of due) {
      await this.prisma.$transaction(async (db) => {
        await db.transaction.create({ data: { userId: payment.userId, accountId: payment.accountId, categoryId: payment.categoryId, amount: payment.amount, currency: payment.currency, type: payment.type, description: payment.name, merchant: payment.name, date: payment.nextExecution, tags: ['recurring'] } });
        await db.account.update({ where: { id: payment.accountId }, data: { currentBalance: { increment: signedAmount(payment.type, payment.amount.toNumber()) } } });
        await db.recurringPayment.update({ where: { id: payment.id }, data: { lastExecutedAt: now, nextExecution: nextOccurrence(payment.nextExecution, payment.frequency) } });
        await db.notification.create({ data: { userId: payment.userId, type: 'RECURRING_PROCESSED', messageKey: 'notifications.recurringProcessed', payload: { name: payment.name, amount: payment.amount.toString(), currency: payment.currency } } });
      });
    }
    return { processed: due.length };
  }
}

@Controller('recurring-payments')
class RecurringController {
  constructor(private readonly recurring: RecurringService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.recurring.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: RecurringDto) { return this.recurring.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRecurringDto) { return this.recurring.update(user.id, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.recurring.remove(user.id, id); }
}

@Module({ imports: [BullModule.registerQueue({ name: 'recurring-payments' })], controllers: [RecurringController], providers: [RecurringService, RecurringProcessor] })
export class RecurringModule {}
