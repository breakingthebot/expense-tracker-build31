// src/services/budgetAlert.ts
// Service logic to evaluate category spent aggregates and trigger boundary-crossing limit alerts.
// Connects to: src/models/expense.ts
// Created: 2026-07-18

import { Expense } from '../models/expense';

export interface BudgetCrossResult {
  crossed: boolean;
  oldSpent: number;
  newSpent: number;
  limit: number;
}

/**
 * Checks if a new transaction or transaction update pushes the category spent total
 * over its configured monthly spending budget limit.
 */
export function isBudgetExceeded(
  expenses: Expense[],
  category: string,
  amountCents: number,
  dateStr: string,
  limitCents: number,
  excludeId?: string
): BudgetCrossResult {
  if (limitCents <= 0) {
    return { crossed: false, oldSpent: 0, newSpent: 0, limit: 0 };
  }

  const yyyyMm = dateStr.substring(0, 7); // e.g. "2026-07"
  let oldSpent = 0;
  expenses.forEach((item) => {
    if (
      item.id !== excludeId &&
      item.category === category &&
      (item.type ?? 'expense') === 'expense' &&
      item.date.startsWith(yyyyMm)
    ) {
      oldSpent += item.amountCents;
    }
  });

  const newSpent = oldSpent + amountCents;
  const crossed = oldSpent < limitCents && newSpent >= limitCents;

  return { crossed, oldSpent, newSpent, limit: limitCents };
}
