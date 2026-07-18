// src/services/trendSummary.ts
// Aggregates spending/income data over a rolling 3-month window to calculate trends
// and percentage changes per category.
// Connects to: src/models/expense.ts, src/utils/date.ts
// Created: 2026-07-17

import { ExpenseCategory } from '../config/categories';
import { Expense, TransactionType } from '../models/expense';
import { shiftMonthKey } from '../utils/date';

export interface MonthlyAmount {
  monthKey: string;
  label: string; // e.g. "May"
  amountCents: number;
}

export interface CategoryTrend {
  category: ExpenseCategory;
  months: MonthlyAmount[]; // exactly 3 elements, ordered oldest to newest
  percentageChange: number | null; // percentage change from prev month to latest, null if prev month was $0.00
  latestAmountCents: number;
  totalAmountCents: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns a timezone-safe short month name from a yyyy-mm key. */
function getShortMonthLabel(monthKey: string): string {
  const [, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  return MONTH_NAMES[monthIdx] || monthStr;
}

/**
 * Computes a 3-month trend summary for all categories that had transactions in the period.
 * Summarizes the last 3 months ending at `latestMonthKey` matching the typePreference.
 */
export function getTrendSummary(
  expenses: Expense[],
  latestMonthKey: string,
  typePreference: TransactionType = 'expense'
): CategoryTrend[] {
  // 1. Resolve the 3 target month keys
  const month1 = shiftMonthKey(latestMonthKey, -2); // Oldest
  const month2 = shiftMonthKey(latestMonthKey, -1); // Previous
  const month3 = latestMonthKey;                    // Latest

  const targetMonths = [month1, month2, month3];

  // 2. Accumulate cents per category per month
  const categoryMap = new Map<ExpenseCategory, Record<string, number>>();

  expenses.forEach((expense) => {
    const expenseType = expense.type ?? 'expense';
    if (expenseType !== typePreference) {
      return;
    }
    const expenseMonth = expense.date.slice(0, 7); // yyyy-mm
    if (targetMonths.includes(expenseMonth)) {
      if (!categoryMap.has(expense.category)) {
        categoryMap.set(expense.category, {
          [month1]: 0,
          [month2]: 0,
          [month3]: 0,
        });
      }
      const record = categoryMap.get(expense.category)!;
      record[expenseMonth] += expense.amountCents;
    }
  });

  // 3. Construct category trends
  const trends: CategoryTrend[] = [];

  categoryMap.forEach((monthSums, category) => {
    const m1Sum = monthSums[month1];
    const m2Sum = monthSums[month2];
    const m3Sum = monthSums[month3];

    // Percentage change from month2 to month3
    let pctChange: number | null = null;
    if (m2Sum > 0) {
      pctChange = Math.round(((m3Sum - m2Sum) / m2Sum) * 100);
    } else if (m2Sum === 0 && m3Sum === 0) {
      pctChange = 0;
    }

    trends.push({
      category,
      months: [
        { monthKey: month1, label: getShortMonthLabel(month1), amountCents: m1Sum },
        { monthKey: month2, label: getShortMonthLabel(month2), amountCents: m2Sum },
        { monthKey: month3, label: getShortMonthLabel(month3), amountCents: m3Sum },
      ],
      percentageChange: pctChange,
      latestAmountCents: m3Sum,
      totalAmountCents: m1Sum + m2Sum + m3Sum,
    });
  });

  // Sort by latest month spending desc, then by total spending desc
  return trends.sort((a, b) => b.latestAmountCents - a.latestAmountCents || b.totalAmountCents - a.totalAmountCents);
}
