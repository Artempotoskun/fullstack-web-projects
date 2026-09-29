import { analyticsSummary, budgetUsage, comparePeriods, importFingerprint, matchCategory, nextBalance, nextOccurrence, parseImportRow, signedAmount, transferBalances } from '../src/domain/finance';

describe('finance domain', () => {
  it('applies signed balance deltas without counting transfers', () => {
    expect(signedAmount('INCOME', 500)).toBe(500);
    expect(signedAmount('EXPENSE', 125)).toBe(-125);
    expect(signedAmount('TRANSFER', 125)).toBe(0);
    expect(nextBalance(1_000, { type: 'EXPENSE', amount: 125 })).toBe(875);
  });

  it('updates both sides of a transfer without creating income', () => {
    expect(transferBalances(1_000, 250, 200)).toEqual({ from: 800, to: 450 });
    expect(transferBalances(1_000, 250, 100, 92)).toEqual({ from: 900, to: 342 });
    expect(() => transferBalances(1_000, 250, 0)).toThrow('positive');
  });

  it('calculates budget warnings and overages', () => {
    expect(budgetUsage(10_000, 9_250)).toEqual({ spent: 9250, limit: 10000, remaining: 750, percentage: 92.5, crossedThreshold: 90, exceeded: false });
    expect(budgetUsage(7_000, 7_450).exceeded).toBe(true);
  });

  it('handles empty comparison periods without dividing by zero', () => {
    expect(comparePeriods(0, 0).percentage).toBe(0);
    expect(comparePeriods(100, 0).percentage).toBeNull();
    expect(comparePeriods(90, 100).percentage).toBe(-10);
  });

  it('calculates analytics while excluding transfers', () => {
    expect(analyticsSummary([{ type: 'INCOME', amount: 50_000 }, { type: 'EXPENSE', amount: 12_500 }, { type: 'TRANSFER', amount: 5_000 }])).toEqual({ income: 50_000, expenses: 12_500, savings: 37_500 });
  });

  it('applies the highest-priority enabled categorization rule', () => {
    const category = matchCategory(
      { merchant: 'WOG Kyiv' },
      [
        { categoryId: 'other', matchField: 'MERCHANT', operator: 'CONTAINS', matchValue: 'wog', priority: 20, enabled: true },
        { categoryId: 'fuel', matchField: 'MERCHANT', operator: 'STARTS_WITH', matchValue: 'WOG', priority: 10, enabled: true },
      ],
    );
    expect(category).toBe('fuel');
  });

  it('produces stable duplicate fingerprints', () => {
    const date = new Date('2026-09-21T00:00:00.000Z');
    expect(importFingerprint('account', date, ' SILPO ', -1247)).toBe(importFingerprint('account', date, 'silpo', -1247));
  });

  it('validates and normalizes CSV import rows', () => {
    const mapping = { date: 'Date', description: 'Description', amount: 'Amount' };
    const valid = parseImportRow({ Date: '21.09.2026', Description: ' SILPO ', Amount: '-1 247,50' }, mapping);
    expect(valid.errors).toEqual([]);
    expect(valid.value).toMatchObject({ amount: -1247.5, description: 'SILPO' });
    expect(parseImportRow({ Date: 'not-a-date', Description: '', Amount: 'zero' }, mapping).errors).toHaveLength(3);
  });

  it('advances recurring dates', () => {
    expect(nextOccurrence(new Date('2026-01-15T00:00:00.000Z'), 'MONTHLY').toISOString()).toBe('2026-02-15T00:00:00.000Z');
  });
});
