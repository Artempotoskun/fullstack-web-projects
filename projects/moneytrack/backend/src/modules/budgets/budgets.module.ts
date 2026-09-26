import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { Currency, Prisma } from '@prisma/client';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { budgetUsage } from '../../domain/finance';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

class BudgetDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
  @IsIn(['UAH', 'USD', 'EUR']) currency: Currency;
  @IsDateString() month: string;
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1, { each: true }) @Max(100, { each: true }) alertThresholds?: number[];
}

@Injectable()
class BudgetsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async list(userId: string, monthInput?: string) {
    const month = this.monthStart(monthInput ? new Date(monthInput) : new Date());
    const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
    const budgets = await this.prisma.budget.findMany({ where: { userId, month }, include: { category: true }, orderBy: { categoryId: 'asc' } });
    const expenses = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'currency'], where: { userId, type: 'EXPENSE', date: { gte: month, lt: nextMonth } }, _sum: { amount: true },
    });
    return budgets.map((budget) => {
      const spent = expenses.filter((item) => item.currency === budget.currency && (!budget.categoryId || item.categoryId === budget.categoryId)).reduce((sum, item) => sum + (item._sum.amount?.toNumber() ?? 0), 0);
      return { ...budget, usage: budgetUsage(budget.amount.toNumber(), spent, budget.alertThresholds) };
    });
  }
  async upsert(userId: string, dto: BudgetDto) {
    const month = this.monthStart(new Date(dto.month));
    const existing = await this.prisma.budget.findFirst({ where: { userId, categoryId: dto.categoryId ?? null, month } });
    const budget = existing
      ? await this.prisma.budget.update({ where: { id: existing.id }, data: { amount: new Prisma.Decimal(dto.amount), currency: dto.currency, alertThresholds: dto.alertThresholds ?? [80, 90, 100] } })
      : await this.prisma.budget.create({ data: { userId, categoryId: dto.categoryId, amount: new Prisma.Decimal(dto.amount), currency: dto.currency, month, alertThresholds: dto.alertThresholds ?? [80, 90, 100] } });
    await this.audit.record({ userId, action: 'BUDGET_UPDATED', entityType: 'Budget', entityId: budget.id });
    return budget;
  }
  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.prisma.budget.delete({ where: { id } });
    return { deleted: true };
  }
  private monthStart(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)); }
}

@Controller('budgets')
class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}
  @Get() list(@CurrentUser() user: AuthUser, @Query('month') month?: string) { return this.budgets.list(user.id, month); }
  @Post() upsert(@CurrentUser() user: AuthUser, @Body() dto: BudgetDto) { return this.budgets.upsert(user.id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.budgets.remove(user.id, id); }
}

@Module({ controllers: [BudgetsController], providers: [BudgetsService] })
export class BudgetsModule {}
