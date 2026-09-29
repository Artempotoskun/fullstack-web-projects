import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { Currency, TransactionType } from '@prisma/client';
import { IsDateString, IsOptional } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { comparePeriods } from '../../domain/finance';
import { PrismaService } from '../prisma/prisma.service';

class RangeQuery {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

@Injectable()
class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string) {
    const now = new Date();
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const [accounts, transactions, recent, upcoming, goals] = await Promise.all([
      this.prisma.account.findMany({ where: { userId, archivedAt: null }, orderBy: { createdAt: 'asc' } }),
      this.prisma.transaction.findMany({ where: { userId, type: { not: 'TRANSFER' }, date: { gte: month, lt: nextMonth } }, include: { category: true } }),
      this.prisma.transaction.findMany({ where: { userId }, include: { account: true, category: true }, orderBy: { date: 'desc' }, take: 6 }),
      this.prisma.recurringPayment.findMany({ where: { userId, enabled: true, nextExecution: { gte: now } }, include: { category: true }, orderBy: { nextExecution: 'asc' }, take: 5 }),
      this.prisma.financialGoal.findMany({ where: { userId, archivedAt: null }, orderBy: { createdAt: 'asc' }, take: 4 }),
    ]);
    const byCurrency = (currency: Currency) => {
      const income = this.sum(transactions.filter((item) => item.currency === currency && item.type === 'INCOME'));
      const expenses = this.sum(transactions.filter((item) => item.currency === currency && item.type === 'EXPENSE'));
      return { currency, balance: accounts.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.currentBalance.toNumber(), 0), income, expenses, savings: income - expenses };
    };
    return { period: { from: month, to: nextMonth }, totals: Object.values(Currency).map(byCurrency), accounts, recent, upcoming, goals };
  }

  async trends(userId: string, range: RangeQuery) {
    const to = range.to ? new Date(range.to) : new Date();
    const from = range.from ? new Date(range.from) : new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 5, 1));
    const transactions = await this.prisma.transaction.findMany({ where: { userId, type: { not: 'TRANSFER' }, date: { gte: from, lte: to } }, include: { category: true }, orderBy: { date: 'asc' } });
    const months = new Map<string, { month: string; income: number; expenses: number; savings: number }>();
    const categories = new Map<string, { name: string; color: string; value: number }>();
    for (const item of transactions) {
      const key = item.date.toISOString().slice(0, 7);
      const point = months.get(key) ?? { month: key, income: 0, expenses: 0, savings: 0 };
      if (item.type === 'INCOME') point.income += item.amount.toNumber();
      if (item.type === 'EXPENSE') {
        point.expenses += item.amount.toNumber();
        const category = item.category?.name ?? 'Uncategorized';
        const aggregate = categories.get(category) ?? { name: category, color: item.category?.color ?? '#94a3b8', value: 0 };
        aggregate.value += item.amount.toNumber();
        categories.set(category, aggregate);
      }
      point.savings = point.income - point.expenses;
      months.set(key, point);
    }
    return { range: { from, to }, monthly: [...months.values()], categories: [...categories.values()].sort((a, b) => b.value - a.value), accountBalances: await this.prisma.account.findMany({ where: { userId, archivedAt: null }, select: { name: true, currency: true, currentBalance: true } }) };
  }

  async comparison(userId: string) {
    const now = new Date();
    const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const rows = await this.prisma.transaction.findMany({ where: { userId, type: 'EXPENSE', date: { gte: previousStart, lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) } }, include: { category: true } });
    const previous = rows.filter((item) => item.date < currentStart);
    const current = rows.filter((item) => item.date >= currentStart);
    const names = new Set(rows.map((item) => item.category?.name ?? 'Uncategorized'));
    return {
      periods: { previous: previousStart.toISOString().slice(0, 7), current: currentStart.toISOString().slice(0, 7) },
      expenses: comparePeriods(this.sum(current), this.sum(previous)),
      categories: [...names].map((name) => ({ name, ...comparePeriods(this.sum(current.filter((item) => (item.category?.name ?? 'Uncategorized') === name)), this.sum(previous.filter((item) => (item.category?.name ?? 'Uncategorized') === name))) })),
    };
  }

  private sum(items: Array<{ amount: { toNumber(): number }; type?: TransactionType }>) { return items.reduce((sum, item) => sum + item.amount.toNumber(), 0); }
}

@Controller('analytics')
class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Get('overview') overview(@CurrentUser() user: AuthUser) { return this.analytics.overview(user.id); }
  @Get('trends') trends(@CurrentUser() user: AuthUser, @Query() query: RangeQuery) { return this.analytics.trends(user.id, query); }
  @Get('comparison') comparison(@CurrentUser() user: AuthUser) { return this.analytics.comparison(user.id); }
}

@Module({ controllers: [AnalyticsController], providers: [AnalyticsService] })
export class AnalyticsModule {}
