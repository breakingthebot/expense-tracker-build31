// src/config/categories.ts
// Fixed list of expense categories offered in the Add Expense form.
// Connects to: src/models/expense.ts, src/components/AddExpenseForm.tsx
// Created: 2026-07-12

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
