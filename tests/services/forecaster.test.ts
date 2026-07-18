// tests/services/forecaster.test.ts
// Unit tests for the forecaster service.
// Mirrors: src/services/forecaster.ts
// Created: 2026-07-18

import { forecastBalance } from '../../src/services/forecaster';
import { Expense } from '../../src/models/expense';
import { RecurringExpense } from '../../src/models/recurring';

describe('forecastBalance', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      amountCents: 10000, // $100
      category: 'Food',
      note: 'Grocery',
      date: '2026-07-10',
      type: 'expense',
      createdAt: '2026-07-10T12:00:00Z',
    },
    {
      id: '2',
      amountCents: 50000, // $500
      category: 'Other',
      note: 'Salary payment',
      date: '2026-07-15',
      type: 'income',
      createdAt: '2026-07-15T09:00:00Z',
    },
    // Manual future transaction
    {
      id: '3',
      amountCents: 20000, // $200
      category: 'Utilities',
      note: 'Future electricity bill',
      date: '2026-07-25',
      type: 'expense',
      createdAt: '2026-07-15T10:00:00Z',
    },
  ];

  const mockSchedules: RecurringExpense[] = [
    {
      id: 'rec-1',
      amountCents: 5000, // $50
      category: 'Entertainment',
      note: 'Weekly streaming bill',
      interval: 'weekly',
      startDate: '2026-07-10',
      lastGeneratedDate: '2026-07-17',
      createdAt: '2026-07-10T10:00:00Z',
      type: 'expense',
    },
    {
      id: 'rec-2',
      amountCents: 100000, // $1000
      category: 'Other',
      note: 'Monthly salary cash flow',
      interval: 'monthly',
      startDate: '2026-07-01',
      lastGeneratedDate: '2026-07-01',
      createdAt: '2026-07-01T10:00:00Z',
      type: 'income',
    },
  ];

  it('calculates current balance up to today and projects balance correctly for future target dates', () => {
    // Current balance should be $500 (income) - $100 (expense) = $400 (40000 cents)
    const result = forecastBalance(mockExpenses, mockSchedules, '2026-08-05', '2026-07-18');

    expect(result.currentBalanceCents).toBe(40000);

    // Projected future items:
    // 1. Manual future expense: -$200 (2026-07-25)
    // 2. Weekly stream: -$50 (2026-07-24)
    // 3. Weekly stream: -$50 (2026-07-31)
    // 4. Monthly salary: +$1000 (2026-08-01)
    // Total change: -$200 - $50 - $50 + $1000 = +$700
    // Projected balance should be $400 + $700 = $1100 (110000 cents)
    expect(result.projectedBalanceCents).toBe(110000);

    // Assert items details
    expect(result.items).toHaveLength(4);
    
    // Manual future item
    const manualItem = result.items.find((item) => item.id === '3');
    expect(manualItem).toBeTruthy();
    expect(manualItem?.isSimulated).toBe(false);

    // Simulated recurring items
    const simulatedItems = result.items.filter((item) => item.isSimulated);
    expect(simulatedItems).toHaveLength(3);
  });

  it('respects starting balance and filters transactions by starting date correctly', () => {
    // Starting balance of $1000 (100000 cents) on 2026-07-12
    // Logged transactions:
    // - 2026-07-10: Grocery -$100 (ignored because < startingDate 2026-07-12)
    // - 2026-07-15: Salary +$500 (included because >= startingDate and <= today 2026-07-18)
    // Current balance should be $1000 + $500 = $1500 (150000 cents)
    const result = forecastBalance(mockExpenses, mockSchedules, '2026-08-05', '2026-07-18', 100000, '2026-07-12');

    expect(result.currentBalanceCents).toBe(150000);

    // Projected future items after today 2026-07-18:
    // - 2026-07-24: Weekly streaming -$50
    // - 2026-07-25: Manual future Utilities -$200
    // - 2026-07-31: Weekly streaming -$50
    // - 2026-08-01: Monthly salary +$1000
    // Total projected balance = $1500 - $50 - $200 - $50 + $1000 = $2200 (220000 cents)
    expect(result.projectedBalanceCents).toBe(220000);
  });
});
