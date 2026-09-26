import { AccountType, CategoryKind, Currency, PrismaClient, TransactionType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function dateInMonth(monthOffset: number, day: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, day, 10));
}

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'demo@moneytrack.local';
  const password = process.env.SEED_USER_PASSWORD ?? 'MoneyTrackDemo123!';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) await prisma.user.delete({ where: { id: existing.id } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password, 12),
      firstName: 'Alex',
      lastName: 'Morgan',
      primaryCurrency: Currency.UAH,
      preferredLanguage: 'EN',
      theme: 'dark',
    },
  });

  const categories = new Map<string, string>();
  const categorySeeds = [
    ['Food', CategoryKind.EXPENSE, '#f59e0b'], ['Housing', CategoryKind.EXPENSE, '#8b5cf6'],
    ['Car', CategoryKind.EXPENSE, '#06b6d4'], ['Shopping', CategoryKind.EXPENSE, '#ec4899'],
    ['Entertainment', CategoryKind.EXPENSE, '#f97316'], ['Health', CategoryKind.EXPENSE, '#10b981'],
    ['Education', CategoryKind.EXPENSE, '#3b82f6'], ['Subscriptions', CategoryKind.EXPENSE, '#6366f1'],
    ['Travel', CategoryKind.EXPENSE, '#14b8a6'], ['Other', CategoryKind.EXPENSE, '#64748b'],
    ['Salary', CategoryKind.INCOME, '#22c55e'], ['Other income', CategoryKind.INCOME, '#84cc16'],
  ] as const;
  for (const [name, kind, color] of categorySeeds) {
    const category = await prisma.category.create({ data: { userId: user.id, name, kind, color, isSystem: true } });
    categories.set(name, category.id);
  }
  for (const name of ['Fuel', 'Service', 'Insurance', 'Parts']) {
    const category = await prisma.category.create({ data: { userId: user.id, parentId: categories.get('Car'), name, kind: CategoryKind.EXPENSE, color: '#0891b2', isSystem: true } });
    categories.set(name, category.id);
  }

  const privat = await prisma.account.create({ data: { userId: user.id, name: 'PrivatBank', type: AccountType.BANK, currency: Currency.UAH, initialBalance: 38_200, currentBalance: 42_350, description: 'Daily spending account' } });
  const mono = await prisma.account.create({ data: { userId: user.id, name: 'Monobank', type: AccountType.BANK, currency: Currency.UAH, initialBalance: 17_100, currentBalance: 18_420, description: 'Bills and subscriptions' } });
  const cash = await prisma.account.create({ data: { userId: user.id, name: 'Cash', type: AccountType.CASH, currency: Currency.UAH, initialBalance: 8_500, currentBalance: 7_500 } });
  const savings = await prisma.account.create({ data: { userId: user.id, name: 'USD Savings', type: AccountType.SAVINGS, currency: Currency.USD, initialBalance: 1_200, currentBalance: 1_500, description: 'Emergency reserve' } });

  const transactionSeeds = [
    { accountId: privat.id, categoryId: categories.get('Salary'), amount: 50_400, currency: Currency.UAH, type: TransactionType.INCOME, description: 'September salary', merchant: 'Acme Studio', date: dateInMonth(0, 2) },
    { accountId: privat.id, categoryId: categories.get('Food'), amount: 1_247, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Weekly groceries', merchant: 'Silpo', date: dateInMonth(0, 5) },
    { accountId: privat.id, categoryId: categories.get('Fuel'), amount: 1_800, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Fuel', merchant: 'WOG', date: dateInMonth(0, 8) },
    { accountId: mono.id, categoryId: categories.get('Subscriptions'), amount: 449, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Netflix monthly', merchant: 'Netflix', date: dateInMonth(0, 15) },
    { accountId: mono.id, categoryId: categories.get('Housing'), amount: 18_000, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Apartment rent', merchant: 'Rent', date: dateInMonth(0, 1) },
    { accountId: cash.id, categoryId: categories.get('Service'), amount: 4_200, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Car maintenance', merchant: 'Auto Lab', date: dateInMonth(0, 19) },
    { accountId: privat.id, categoryId: categories.get('Food'), amount: 10_450, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Monthly groceries', merchant: 'ATB', date: dateInMonth(-1, 22) },
    { accountId: mono.id, categoryId: categories.get('Housing'), amount: 18_000, currency: Currency.UAH, type: TransactionType.EXPENSE, description: 'Apartment rent', merchant: 'Rent', date: dateInMonth(-1, 1) },
    { accountId: privat.id, categoryId: categories.get('Salary'), amount: 50_400, currency: Currency.UAH, type: TransactionType.INCOME, description: 'Previous salary', merchant: 'Acme Studio', date: dateInMonth(-1, 2) },
  ];
  await prisma.transaction.createMany({ data: transactionSeeds.map((item) => ({ ...item, userId: user.id, tags: item.type === TransactionType.EXPENSE ? ['demo'] : ['income'] })) });

  const month = dateInMonth(0, 1);
  await prisma.budget.createMany({ data: [
    { userId: user.id, categoryId: categories.get('Food'), amount: 10_000, currency: Currency.UAH, month, alertThresholds: [80, 90, 100] },
    { userId: user.id, categoryId: categories.get('Fuel'), amount: 7_000, currency: Currency.UAH, month, alertThresholds: [80, 90, 100] },
    { userId: user.id, categoryId: categories.get('Entertainment'), amount: 5_000, currency: Currency.UAH, month, alertThresholds: [80, 90, 100] },
  ] });

  await prisma.financialGoal.createMany({ data: [
    { userId: user.id, name: 'New Laptop', targetAmount: 80_000, currentAmount: 32_000, currency: Currency.UAH, targetDate: dateInMonth(5, 1), description: 'Workstation upgrade' },
    { userId: user.id, name: 'Emergency Fund', targetAmount: 5_000, currentAmount: 1_500, currency: Currency.USD, targetDate: dateInMonth(10, 1), description: 'Six months of essential expenses' },
  ] });

  await prisma.recurringPayment.createMany({ data: [
    { userId: user.id, accountId: mono.id, categoryId: categories.get('Subscriptions'), name: 'Netflix', amount: 449, currency: Currency.UAH, type: TransactionType.EXPENSE, frequency: 'MONTHLY', nextExecution: dateInMonth(1, 15) },
    { userId: user.id, accountId: mono.id, categoryId: categories.get('Housing'), name: 'Rent', amount: 18_000, currency: Currency.UAH, type: TransactionType.EXPENSE, frequency: 'MONTHLY', nextExecution: dateInMonth(1, 1) },
    { userId: user.id, accountId: privat.id, categoryId: categories.get('Subscriptions'), name: 'Internet', amount: 350, currency: Currency.UAH, type: TransactionType.EXPENSE, frequency: 'MONTHLY', nextExecution: dateInMonth(1, 5) },
  ] });

  await prisma.categorizationRule.createMany({ data: [
    { userId: user.id, categoryId: categories.get('Fuel')!, matchField: 'MERCHANT', operator: 'CONTAINS', matchValue: 'WOG', priority: 10 },
    { userId: user.id, categoryId: categories.get('Fuel')!, matchField: 'MERCHANT', operator: 'CONTAINS', matchValue: 'OKKO', priority: 20 },
    { userId: user.id, categoryId: categories.get('Food')!, matchField: 'MERCHANT', operator: 'CONTAINS', matchValue: 'Silpo', priority: 10 },
    { userId: user.id, categoryId: categories.get('Food')!, matchField: 'MERCHANT', operator: 'CONTAINS', matchValue: 'ATB', priority: 20 },
    { userId: user.id, categoryId: categories.get('Subscriptions')!, matchField: 'MERCHANT', operator: 'CONTAINS', matchValue: 'Netflix', priority: 10 },
  ] });

  await prisma.auditLog.create({ data: { userId: user.id, action: 'DEMO_DATA_SEEDED', entityType: 'User', entityId: user.id, metadata: { accounts: 4, transactions: transactionSeeds.length } } });
  console.log(`MoneyTrack demo seeded for ${email}`);
}

main().finally(async () => prisma.$disconnect());
