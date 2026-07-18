// src/services/monthlySummary.ts
// Aggregates stored expenses into per-category totals for a given month.
// Pure functions (no storage I/O) so they're cheap to unit test in
// isolation from AsyncStorage.
// Connects to: src/models/expense.ts, src/config/categories.ts, src/components/MonthlyChart.tsx, App.tsx
// Created: 2026-07-12

import { ExpenseCategory } from '../config/categories';
import { Expense, TransactionType } from '../models/expense';

export interface CategoryTotal {
  category: ExpenseCategory;
  totalCents: number;
}

export interface MonthlySummary {
  monthKey: string;
  totalCents: number;
  /** Only categories with spending/income in this month, sorted highest first. */
  categoryTotals: CategoryTotal[];
}

/** Returns the current month as a yyyy-mm key, in the device's local time. */
export function currentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Summarizes transactions by category for one month.
 * `expenses` can span any range — only entries whose date falls in `monthKey`
 * (yyyy-mm) and matches the typePreference ('expense' or 'income') are counted.
 */
export function summarizeMonth(
  expenses: Expense[],
  monthKey: string,
  typePreference: TransactionType = 'expense'
): MonthlySummary {
  const totalsByCategory = new Map<ExpenseCategory, number>();

  for (const expense of expenses) {
    const expenseType = expense.type ?? 'expense';
    if (!expense.date.startsWith(monthKey) || expenseType !== typePreference) {
      continue;
    }
    totalsByCategory.set(
      expense.category,
      (totalsByCategory.get(expense.category) ?? 0) + expense.amountCents
    );
  }

  const categoryTotals = Array.from(totalsByCategory.entries())
    .map(([category, totalCents]) => ({
      category,
      totalCents,
    }))
    .filter((entry) => entry.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents);

  const totalCents = categoryTotals.reduce((sum, entry) => sum + entry.totalCents, 0);

  return { monthKey, totalCents, categoryTotals };
}

export interface WeeklyTotal {
  weekLabel: string;
  totalCents: number;
  startDate: string;
  endDate: string;
  dailyCents: number[]; // Sparkline daily totals
}

export interface MonthlyWeeklySummary {
  monthKey: string;
  totalCents: number;
  weeklyTotals: WeeklyTotal[];
}

export function summarizeWeeks(
  expenses: Expense[],
  monthKey: string,
  typePreference: TransactionType = 'expense'
): MonthlyWeeklySummary {
  const weekBuckets = [
    { label: 'Week 1', start: 1, end: 7, totalCents: 0, dailyCents: Array(7).fill(0) },
    { label: 'Week 2', start: 8, end: 14, totalCents: 0, dailyCents: Array(7).fill(0) },
    { label: 'Week 3', start: 15, end: 21, totalCents: 0, dailyCents: Array(7).fill(0) },
    { label: 'Week 4', start: 22, end: 28, totalCents: 0, dailyCents: Array(7).fill(0) },
    { label: 'Week 5', start: 29, end: 31, totalCents: 0, dailyCents: Array(3).fill(0) },
  ];

  for (const expense of expenses) {
    const expenseType = expense.type ?? 'expense';
    if (!expense.date.startsWith(monthKey) || expenseType !== typePreference) {
      continue;
    }

    const day = parseInt(expense.date.substring(8, 10), 10);
    if (isNaN(day)) continue;

    for (const bucket of weekBuckets) {
      if (day >= bucket.start && day <= bucket.end) {
        bucket.totalCents += expense.amountCents;
        bucket.dailyCents[day - bucket.start] += expense.amountCents;
        break;
      }
    }
  }

  const weeklyTotals = weekBuckets.map((b) => ({
    weekLabel: b.label,
    totalCents: b.totalCents,
    startDate: `${monthKey}-${String(b.start).padStart(2, '0')}`,
    endDate: `${monthKey}-${String(b.end).padStart(2, '0')}`,
    dailyCents: b.dailyCents,
  }));

  const totalCents = weeklyTotals.reduce((sum, wt) => sum + wt.totalCents, 0);

  return { monthKey, totalCents, weeklyTotals };
}
