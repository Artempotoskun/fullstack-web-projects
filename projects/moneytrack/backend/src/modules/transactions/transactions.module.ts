import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { Currency, Prisma, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { signedAmount } from '../../domain/finance';
import { AuditService } from '../audit/audit.service';
import { CategorizationModule, CategorizationService } from '../categorization/categorization.module';
import { PrismaService } from '../prisma/prisma.service';

class CreateTransactionDto {
  @IsUUID() accountId: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
  @IsIn(['UAH', 'USD', 'EUR']) currency: Currency;
  @IsIn(['INCOME', 'EXPENSE']) type: TransactionType;
  @IsString() @Length(1, 180) description: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() @Length(0, 120) merchant?: string;
  @IsOptional() @IsString() @Length(0, 500) notes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

class UpdateTransactionDto {
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;
  @IsOptional() @IsIn(['UAH', 'USD', 'EUR']) currency?: Currency;
  @IsOptional() @IsIn(['INCOME', 'EXPENSE']) type?: TransactionType;
  @IsOptional() @IsString() @Length(1, 180) description?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() @Length(0, 120) merchant?: string;
  @IsOptional() @IsString() @Length(0, 500) notes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

class TransferDto {
  @IsUUID() fromAccountId: string;
  @IsUUID() toAccountId: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) receivedAmount?: number;
  @IsDateString() date: string;
  @IsOptional() @IsString() @Length(0, 180) description?: string;
}

class TransactionQueryDto {
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['INCOME', 'EXPENSE', 'TRANSFER']) type?: TransactionType;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsNumber() minAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxAmount?: number;
  @IsOptional() @Type(() => Number) @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @Min(1) @Max(100) limit = 25;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categorization: CategorizationService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string, query: TransactionQueryDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      accountId: query.accountId,
      categoryId: query.categoryId,
      type: query.type,
      date: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
      amount: query.minAmount !== undefined || query.maxAmount !== undefined ? { gte: query.minAmount, lte: query.maxAmount } : undefined,
      OR: query.search ? [
        { description: { contains: query.search, mode: 'insensitive' } },
        { merchant: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ] : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({ where, include: { account: { select: { id: true, name: true } }, category: { select: { id: true, name: true, color: true } } }, orderBy: { date: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) };
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.assertAccount(userId, dto.accountId);
    let categoryId = dto.categoryId;
    if (!categoryId) categoryId = (await this.categorization.resolve(userId, dto.description, dto.merchant)) ?? undefined;
    if (categoryId) await this.assertCategory(userId, categoryId);
    const amount = new Prisma.Decimal(dto.amount);
    const transaction = await this.prisma.$transaction(async (db) => {
      const created = await db.transaction.create({ data: { ...dto, userId, categoryId, amount, date: new Date(dto.date), description: dto.description.trim(), merchant: dto.merchant?.trim(), tags: dto.tags ?? [] } });
      await db.account.update({ where: { id: dto.accountId }, data: { currentBalance: { increment: signedAmount(dto.type, dto.amount) } } });
      return created;
    });
    await this.audit.record({ userId, action: 'TRANSACTION_CREATED', entityType: 'Transaction', entityId: transaction.id, metadata: { type: transaction.type, currency: transaction.currency } });
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId, type: { not: 'TRANSFER' } } });
    if (!existing) throw new NotFoundException('Transaction not found');
    const targetAccountId = dto.accountId ?? existing.accountId;
    await this.assertAccount(userId, targetAccountId);
    if (dto.categoryId) await this.assertCategory(userId, dto.categoryId);
    const nextAmount = dto.amount ?? existing.amount.toNumber();
    const nextType = dto.type ?? existing.type;
    return this.prisma.$transaction(async (db) => {
      await db.account.update({ where: { id: existing.accountId }, data: { currentBalance: { decrement: signedAmount(existing.type, existing.amount.toNumber()) } } });
      await db.account.update({ where: { id: targetAccountId }, data: { currentBalance: { increment: signedAmount(nextType, nextAmount) } } });
      return db.transaction.update({
        where: { id },
        data: { ...dto, amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined, date: dto.date ? new Date(dto.date) : undefined, description: dto.description?.trim(), merchant: dto.merchant?.trim() },
      });
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId, type: { not: 'TRANSFER' } } });
    if (!existing) throw new NotFoundException('Transaction not found');
    await this.prisma.$transaction([
      this.prisma.account.update({ where: { id: existing.accountId }, data: { currentBalance: { decrement: signedAmount(existing.type, existing.amount.toNumber()) } } }),
      this.prisma.transaction.delete({ where: { id } }),
    ]);
    await this.audit.record({ userId, action: 'TRANSACTION_DELETED', entityType: 'Transaction', entityId: id });
    return { deleted: true };
  }

  async transfer(userId: string, dto: TransferDto) {
    if (dto.fromAccountId === dto.toAccountId) throw new NotFoundException('Source and destination accounts must be different');
    const [from, to] = await Promise.all([this.assertAccount(userId, dto.fromAccountId), this.assertAccount(userId, dto.toAccountId)]);
    const transferGroupId = randomUUID();
    const received = dto.receivedAmount ?? dto.amount;
    const date = new Date(dto.date);
    const description = dto.description?.trim() || `${from.name} → ${to.name}`;
    const records = await this.prisma.$transaction(async (db) => {
      const outgoing = await db.transaction.create({ data: { userId, accountId: from.id, amount: dto.amount, currency: from.currency, type: 'TRANSFER', description, date, transferGroupId, tags: [] } });
      const incoming = await db.transaction.create({ data: { userId, accountId: to.id, amount: received, currency: to.currency, type: 'TRANSFER', description, date, transferGroupId, tags: [] } });
      await db.account.update({ where: { id: from.id }, data: { currentBalance: { decrement: dto.amount } } });
      await db.account.update({ where: { id: to.id }, data: { currentBalance: { increment: received } } });
      return [outgoing, incoming];
    });
    await this.audit.record({ userId, action: 'TRANSFER_CREATED', entityType: 'Transaction', entityId: transferGroupId, metadata: { fromAccountId: from.id, toAccountId: to.id } });
    return { transferGroupId, transactions: records };
  }

  private async assertAccount(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId, archivedAt: null } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  private async assertCategory(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId, archivedAt: null } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}

@Controller('transactions')
class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Get() list(@CurrentUser() user: AuthUser, @Query() query: TransactionQueryDto) { return this.transactions.list(user.id, query); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) { return this.transactions.create(user.id, dto); }
  @Post('transfer') transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferDto) { return this.transactions.transfer(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTransactionDto) { return this.transactions.update(user.id, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.transactions.remove(user.id, id); }
}

@Module({ imports: [CategorizationModule], controllers: [TransactionsController], providers: [TransactionsService], exports: [TransactionsService] })
export class TransactionsModule {}
