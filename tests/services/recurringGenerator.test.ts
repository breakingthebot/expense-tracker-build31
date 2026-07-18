// tests/services/recurringGenerator.test.ts
// Unit tests for the recurring expense schedules generator.
// Connects to: src/services/recurringGenerator.ts
// Created: 2026-07-18

import { getRecurringInstanceDates, generateExpensesFromSchedules } from '../../src/services/recurringGenerator';
import { RecurringExpense } from '../../src/models/recurring';

describe('recurringGenerator - getRecurringInstanceDates', () => {
  it('generates daily dates correctly', () => {
    // Start date: May 10, today: May 13
    // 4 instances: 10th, 11th, 12th, 13th
    expect(getRecurringInstanceDates('2026-05-10', null, '2026-05-13', 'daily')).toEqual([
      '2026-05-10',
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
    ]);

    // Already generated up to 11th
    expect(getRecurringInstanceDates('2026-05-10', '2026-05-11', '2026-05-13', 'daily')).toEqual([
      '2026-05-12',
      '2026-05-13',
    ]);
  });

  it('generates weekly dates correctly', () => {
    // Start: May 1, today: May 16
    // Weekly instances: May 1, May 8, May 15
    expect(getRecurringInstanceDates('2026-05-01', null, '2026-05-16', 'weekly')).toEqual([
      '2026-05-01',
      '2026-05-08',
      '2026-05-15',
    ]);

    // Already generated up to May 8
    expect(getRecurringInstanceDates('2026-05-01', '2026-05-08', '2026-05-16', 'weekly')).toEqual([
      '2026-05-15',
    ]);
  });

  it('generates monthly dates correctly and caps month-end days', () => {
    // Start: Jan 31, today: Apr 5
    // Monthly candidates: Jan 31, Feb 28 (leap cap), Mar 31
    expect(getRecurringInstanceDates('2026-01-31', null, '2026-04-05', 'monthly')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);

    // Leap year (2024 is leap year, Feb has 29 days)
    expect(getRecurringInstanceDates('2024-01-31', null, '2024-03-05', 'monthly')).toEqual([
      '2024-01-31',
      '2024-02-29',
    ]);
  });

  it('generates yearly dates correctly and caps leap years', () => {
    // Start: Feb 29, 2024 (Leap year), today: Mar 1, 2026
    // Candidate dates: Feb 29 2024, Feb 28 2025 (capped), Feb 28 2026 (capped)
    expect(getRecurringInstanceDates('2024-02-29', null, '2026-03-01', 'yearly')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
    ]);
  });
});

describe('recurringGenerator - generateExpensesFromSchedules', () => {
  it('correctly creates transactions and updates lastGeneratedDate', () => {
    const schedules: RecurringExpense[] = [
      {
        id: 'rec-1',
        amountCents: 120000,
        category: 'Housing',
        note: 'Rent payment',
        interval: 'monthly',
        startDate: '2026-05-01',
        lastGeneratedDate: '2026-05-01',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    ];

    const result = generateExpensesFromSchedules(schedules, '2026-07-02');

    // Expected monthly instances after May 01 up to July 02: June 01, July 01
    expect(result.generatedExpenses).toHaveLength(2);
    expect(result.generatedExpenses[0].date).toBe('2026-06-01');
    expect(result.generatedExpenses[0].note).toBe('Rent payment');
    expect(result.generatedExpenses[0].amountCents).toBe(120000);
    expect(result.generatedExpenses[1].date).toBe('2026-07-01');

    // Updated schedule should have lastGeneratedDate = July 1
    expect(result.updatedSchedules).toHaveLength(1);
    expect(result.updatedSchedules[0].lastGeneratedDate).toBe('2026-07-01');
  });
});
