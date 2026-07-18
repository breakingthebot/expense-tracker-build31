// tests/services/budgetAlert.test.ts
// Unit tests for the budgetAlert service.
// Mirrors: src/services/budgetAlert.ts
// Created: 2026-07-18

import { isBudgetExceeded } from '../../src/services/budgetAlert';
import { Expense } from '../../src/models/expense';

describe('budgetAlert', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      amountCents: 5000, // $50
      category: 'Food',
      note: 'Dinner',
      date: '2026-07-10',
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      amountCents: 3000, // $30
      category: 'Food',
      note: 'Lunch',
      date: '2026-07-15',
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      amountCents: 10000, // $100
      category: 'Utilities',
      note: 'Water',
      date: '2026-07-11',
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
  ];

  it('returns crossed false if no category budget limit is set', () => {
    const result = isBudgetExceeded(mockExpenses, 'Food', 2000, '2026-07-20', 0);
    expect(result.crossed).toBe(false);
  });

  it('detects when adding an expense crosses the category limit threshold', () => {
    // Current total spent is $80 (8000 cents). New spent is $30 (3000 cents) -> total $110.
    // Budget is $100 (10000 cents). Crossing occurs because $80 < $100 and $110 >= $100.
    const result = isBudgetExceeded(mockExpenses, 'Food', 3000, '2026-07-20', 10000);
    expect(result.crossed).toBe(true);
    expect(result.oldSpent).toBe(8000);
    expect(result.newSpent).toBe(11000);
  });

  it('returns crossed false if spending was already over the budget limit', () => {
    // Current spent is $80. Limit is $60. New spent is $10 -> total $90.
    // Since spending was already over limit ($80 >= $60), no crossing is triggered.
    const result = isBudgetExceeded(mockExpenses, 'Food', 1000, '2026-07-20', 6000);
    expect(result.crossed).toBe(false);
  });

  it('excludes transaction by excludeId during updates evaluation', () => {
    // Evaluating update for transaction '2' ($30) in Food category.
    // Excluding '2', old spent in Food is $50. New update amount is $60 -> total $110.
    // Limit is $100. Crossing occurs because $50 < $100 and $110 >= $100.
    const result = isBudgetExceeded(mockExpenses, 'Food', 6000, '2026-07-20', 10000, '2',);
    expect(result.crossed).toBe(true);
    expect(result.oldSpent).toBe(5000);
    expect(result.newSpent).toBe(11000);
  });
});
