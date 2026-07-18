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
