// tests/services/monthlySummary.test.ts
// Tests for monthly category aggregation.
// Mirrors: src/services/monthlySummary.ts
// Created: 2026-07-12

import { Expense } from '../../src/models/expense';
import { currentMonthKey, summarizeMonth } from '../../src/services/monthlySummary';

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'id',
    amountCents: 1000,
    category: 'Food',
    note: '',
    date: '2026-07-01',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('summarizeMonth', () => {
  it('returns an empty summary when there are no expenses', () => {
    const summary = summarizeMonth([], '2026-07');
    expect(summary).toEqual({ monthKey: '2026-07', totalCents: 0, categoryTotals: [] });
  });

  it('sums amounts per category within the target month', () => {
    const expenses = [
      makeExpense({ category: 'Food', amountCents: 1000, date: '2026-07-01' }),
      makeExpense({ category: 'Food', amountCents: 500, date: '2026-07-15' }),
      makeExpense({ category: 'Housing', amountCents: 2000, date: '2026-07-03' }),
    ];

    const summary = summarizeMonth(expenses, '2026-07');
    expect(summary.totalCents).toBe(3500);
    expect(summary.categoryTotals).toEqual([
      { category: 'Housing', totalCents: 2000 },
      { category: 'Food', totalCents: 1500 },
    ]);
  });

  it('excludes income transactions from spending breakdown totals', () => {
    const expenses = [
      makeExpense({ category: 'Food', amountCents: 1000, date: '2026-07-01', type: 'expense' }),
      makeExpense({ category: 'Other', amountCents: 3000, date: '2026-07-05', type: 'income' }), // Income!
    ];

    const summary = summarizeMonth(expenses, '2026-07');
    expect(summary.totalCents).toBe(1000);
    expect(summary.categoryTotals).toEqual([{ category: 'Food', totalCents: 1000 }]);
  });

  it('excludes expenses outside the target month', () => {
    const expenses = [
      makeExpense({ category: 'Food', amountCents: 1000, date: '2026-06-30' }),
      makeExpense({ category: 'Food', amountCents: 500, date: '2026-08-01' }),
    ];

    const summary = summarizeMonth(expenses, '2026-07');
    expect(summary).toEqual({ monthKey: '2026-07', totalCents: 0, categoryTotals: [] });
  });

  it('excludes categories with no spending this month', () => {
    const expenses = [makeExpense({ category: 'Food', amountCents: 100, date: '2026-07-01' })];
    const summary = summarizeMonth(expenses, '2026-07');
    expect(summary.categoryTotals).toHaveLength(1);
    expect(summary.categoryTotals[0].category).toBe('Food');
  });

  it('sorts categories by total descending', () => {
    const expenses = [
      makeExpense({ category: 'Other', amountCents: 300, date: '2026-07-01' }),
      makeExpense({ category: 'Health', amountCents: 900, date: '2026-07-02' }),
      makeExpense({ category: 'Shopping', amountCents: 600, date: '2026-07-03' }),
    ];

    const summary = summarizeMonth(expenses, '2026-07');
    expect(summary.categoryTotals.map((entry) => entry.category)).toEqual([
      'Health',
      'Shopping',
      'Other',
    ]);
  });
});

describe('currentMonthKey', () => {
  it('returns a yyyy-mm string', () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });
});
