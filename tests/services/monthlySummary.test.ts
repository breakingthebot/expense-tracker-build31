// tests/services/monthlySummary.test.ts
// Tests for monthly category aggregation.
// Mirrors: src/services/monthlySummary.ts
// Created: 2026-07-12

import { Expense } from '../../src/models/expense';
import { currentMonthKey, summarizeMonth, summarizeWeeks } from '../../src/services/monthlySummary';

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

describe('summarizeWeeks', () => {
  it('returns empty weekly buckets when there are no expenses', () => {
    const summary = summarizeWeeks([], '2026-07');
    expect(summary.totalCents).toBe(0);
    expect(summary.weeklyTotals).toHaveLength(5);
    expect(summary.weeklyTotals[0].totalCents).toBe(0);
  });

  it('groups expenses into correct weekly buckets', () => {
    const expenses = [
      makeExpense({ amountCents: 1000, date: '2026-07-03' }), // Week 1
      makeExpense({ amountCents: 1500, date: '2026-07-07' }), // Week 1
      makeExpense({ amountCents: 2000, date: '2026-07-10' }), // Week 2
      makeExpense({ amountCents: 3000, date: '2026-07-18' }), // Week 3
      makeExpense({ amountCents: 4000, date: '2026-07-25' }), // Week 4
      makeExpense({ amountCents: 5000, date: '2026-07-30' }), // Week 5
    ];

    const summary = summarizeWeeks(expenses, '2026-07');
    expect(summary.totalCents).toBe(16500);
    expect(summary.weeklyTotals).toEqual([
      { weekLabel: 'Week 1', totalCents: 2500, startDate: '2026-07-01', endDate: '2026-07-07' },
      { weekLabel: 'Week 2', totalCents: 2000, startDate: '2026-07-08', endDate: '2026-07-14' },
      { weekLabel: 'Week 3', totalCents: 3000, startDate: '2026-07-15', endDate: '2026-07-21' },
      { weekLabel: 'Week 4', totalCents: 4000, startDate: '2026-07-22', endDate: '2026-07-28' },
      { weekLabel: 'Week 5', totalCents: 5000, startDate: '2026-07-29', endDate: '2026-07-31' },
    ]);
  });
});

describe('currentMonthKey', () => {
  it('returns a yyyy-mm string', () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });
});
