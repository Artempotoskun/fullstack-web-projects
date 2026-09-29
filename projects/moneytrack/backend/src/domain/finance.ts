import { createHash } from 'node:crypto';

export type FinanceTransaction = { type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; amount: number };
export type CategorizationCandidate = { description?: string; merchant?: string };
export type CategorizationRuleLike = {
  categoryId: string;
  matchField: 'DESCRIPTION' | 'MERCHANT';
  operator: 'CONTAINS' | 'EQUALS' | 'STARTS_WITH';
  matchValue: string;
  priority: number;
  enabled: boolean;
};
export type ImportRowLike = Record<string, string | number | boolean | null>;
export type ImportMappingLike = { date: string; description: string; amount: string; merchant?: string };

export function signedAmount(type: FinanceTransaction['type'], amount: number): number {
  const normalized = Math.abs(amount);
  if (type === 'INCOME') return normalized;
  if (type === 'EXPENSE') return -normalized;
  return 0;
}

export function nextBalance(current: number, transaction: FinanceTransaction): number {
  return current + signedAmount(transaction.type, transaction.amount);
}

export function transferBalances(fromBalance: number, toBalance: number, sent: number, received = sent) {
  if (sent <= 0 || received <= 0) throw new Error('Transfer amounts must be positive');
  return { from: fromBalance - sent, to: toBalance + received };
}

export function analyticsSummary(transactions: FinanceTransaction[]) {
  const income = transactions.filter((item) => item.type === 'INCOME').reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === 'EXPENSE').reduce((sum, item) => sum + Math.abs(item.amount), 0);
  return { income, expenses, savings: income - expenses };
}

export function budgetUsage(limit: number, spent: number, thresholds = [80, 90, 100]) {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const crossedThreshold = [...thresholds].sort((a, b) => b - a).find((threshold) => percentage >= threshold) ?? null;
  return { spent, limit, remaining: limit - spent, percentage, crossedThreshold, exceeded: spent > limit };
}

export function comparePeriods(current: number, previous: number) {
  const difference = current - previous;
  const percentage = previous === 0 ? (current === 0 ? 0 : null) : (difference / Math.abs(previous)) * 100;
  return { current, previous, difference, percentage };
}

export function matchCategory(candidate: CategorizationCandidate, rules: CategorizationRuleLike[]): string | null {
  const ordered = rules.filter((rule) => rule.enabled).sort((a, b) => a.priority - b.priority);
  for (const rule of ordered) {
    const input = (rule.matchField === 'MERCHANT' ? candidate.merchant : candidate.description)?.trim().toLocaleLowerCase() ?? '';
    const expected = rule.matchValue.trim().toLocaleLowerCase();
    if (!input || !expected) continue;
    const matches = rule.operator === 'EQUALS' ? input === expected : rule.operator === 'STARTS_WITH' ? input.startsWith(expected) : input.includes(expected);
    if (matches) return rule.categoryId;
  }
  return null;
}

export function importFingerprint(accountId: string, date: Date, description: string, amount: number): string {
  return createHash('sha256')
    .update([accountId, date.toISOString().slice(0, 10), description.trim().toLocaleLowerCase(), amount.toFixed(2)].join('|'))
    .digest('hex');
}

export function parseImportRow(row: ImportRowLike, mapping: ImportMappingLike) {
  const rawDate = String(row[mapping.date] ?? '').trim();
  const european = rawDate.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  const date = european ? new Date(Date.UTC(Number(european[3]), Number(european[2]) - 1, Number(european[1]))) : new Date(rawDate);
  const amount = Number(String(row[mapping.amount] ?? '').replace(/\s/g, '').replace(',', '.'));
  const description = String(row[mapping.description] ?? '').trim();
  const merchant = mapping.merchant ? String(row[mapping.merchant] ?? '').trim() : '';
  const errors: string[] = [];
  if (Number.isNaN(date.getTime())) errors.push('Invalid date');
  if (!Number.isFinite(amount) || amount === 0) errors.push('Amount must be a non-zero number');
  if (!description) errors.push('Description is required');
  return { value: errors.length ? null : { date, amount, description, merchant }, errors };
}

export function nextOccurrence(date: Date, frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Date {
  const next = new Date(date);
  if (frequency === 'WEEKLY') next.setUTCDate(next.getUTCDate() + 7);
  if (frequency === 'MONTHLY') next.setUTCMonth(next.getUTCMonth() + 1);
  if (frequency === 'YEARLY') next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}
