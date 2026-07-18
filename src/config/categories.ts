// src/config/categories.ts
// Config definitions for expense categories.
// Re-defined to support dynamic category lists while maintaining
// backwards-compatible fallback structures.
// Created: 2026-07-12

export type ExpenseCategory = string;

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];
