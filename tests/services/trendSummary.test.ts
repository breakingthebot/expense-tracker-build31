// tests/services/trendSummary.test.ts
// Unit tests for the rolling 3-month trend calculation service.
// Connects to: src/services/trendSummary.ts
// Created: 2026-07-17

import { getTrendSummary } from '../../src/services/trendSummary';
import { Expense } from '../../src/models/expense';

describe('getTrendSummary', () => {
  it('returns empty array when there are no expenses', () => {
    expect(getTrendSummary([], '2026-07')).toEqual([]);
  });

  it('aggregates expenses correctly across a rolling 3-month window and calculates percentage changes', () => {
    const expenses: Expense[] = [
      // Food: Month 1 (May) = $50.00, Month 2 (June) = $100.00, Month 3 (July) = $120.00
      { id: '1', amountCents: 5000, category: 'Food', note: '', date: '2026-05-10', createdAt: '' },
      { id: '2', amountCents: 10000, category: 'Food', note: '', date: '2026-06-15', createdAt: '' },
      { id: '3', amountCents: 12000, category: 'Food', note: '', date: '2026-07-20', createdAt: '' },

      // Utilities: Month 1 (May) = $0.00, Month 2 (June) = $50.00, Month 3 (July) = $0.00
      { id: '4', amountCents: 5000, category: 'Utilities', note: '', date: '2026-06-01', createdAt: '' },

      // Shopping: Month 1 (May) = $200.00, Month 2 (June) = $0.00, Month 3 (July) = $50.00
      { id: '5', amountCents: 20000, category: 'Shopping', note: '', date: '2026-05-02', createdAt: '' },
      { id: '6', amountCents: 5000, category: 'Shopping', note: '', date: '2026-07-05', createdAt: '' },

      // Out of bounds: April = should be ignored
      { id: '7', amountCents: 8000, category: 'Food', note: '', date: '2026-04-30', createdAt: '' },
      // Out of bounds: August = should be ignored
      { id: '8', amountCents: 9000, category: 'Food', note: '', date: '2026-08-01', createdAt: '' },
    ];

    const result = getTrendSummary(expenses, '2026-07');

    // Expected order: Food (Latest: 12000), Shopping (Latest: 5000), Utilities (Latest: 0)
    expect(result).toHaveLength(3);

    // Food
    expect(result[0].category).toBe('Food');
    expect(result[0].months).toEqual([
      { monthKey: '2026-05', label: 'May', amountCents: 5000 },
      { monthKey: '2026-06', label: 'Jun', amountCents: 10000 },
      { monthKey: '2026-07', label: 'Jul', amountCents: 12000 },
    ]);
    expect(result[0].latestAmountCents).toBe(12000);
    // Change: (120 - 100) / 100 * 100 = 20%
    expect(result[0].percentageChange).toBe(20);

    // Shopping
    expect(result[1].category).toBe('Shopping');
    expect(result[1].months).toEqual([
      { monthKey: '2026-05', label: 'May', amountCents: 20000 },
      { monthKey: '2026-06', label: 'Jun', amountCents: 0 },
      { monthKey: '2026-07', label: 'Jul', amountCents: 5000 },
    ]);
    expect(result[1].latestAmountCents).toBe(5000);
    // Previous month (June) was 0, so change should be null
    expect(result[1].percentageChange).toBeNull();

    // Utilities
    expect(result[2].category).toBe('Utilities');
    expect(result[2].months).toEqual([
      { monthKey: '2026-05', label: 'May', amountCents: 0 },
      { monthKey: '2026-06', label: 'Jun', amountCents: 5000 },
      { monthKey: '2026-07', label: 'Jul', amountCents: 0 },
    ]);
    expect(result[2].latestAmountCents).toBe(0);
    // Change: (0 - 50) / 50 * 100 = -100%
    expect(result[2].percentageChange).toBe(-100);
  });

  it('excludes income transactions from rolling trend totals', () => {
    const expenses: Expense[] = [
      { id: '1', amountCents: 5000, category: 'Food', note: '', date: '2026-07-10', type: 'expense', createdAt: '' },
      { id: '2', amountCents: 8000, category: 'Food', note: '', date: '2026-07-15', type: 'income', createdAt: '' }, // Income!
    ];

    const result = getTrendSummary(expenses, '2026-07');
    expect(result).toHaveLength(1);
    expect(result[0].latestAmountCents).toBe(5000);
  });
});
