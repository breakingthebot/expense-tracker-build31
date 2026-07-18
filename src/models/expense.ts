// src/models/expense.ts
// Defines the Transaction/Expense data shape and validates inputs before saving.
// Connects to: src/config/categories.ts, src/services/expenseStorage.ts
// Created: 2026-07-12

import { ExpenseCategory } from '../config/categories';

export type TransactionType = 'expense' | 'income';

export interface Expense {
  id: string;
  /** Stored in integer cents to avoid floating-point rounding errors. */
  amountCents: number;
  category: ExpenseCategory;
  note: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** ISO timestamp set when the record was created. */
  createdAt: string;
  /** Defaults to 'expense' if undefined for backward compatibility. */
  type?: TransactionType;
}

export type NewExpenseInput = Pick<Expense, 'amountCents' | 'category' | 'note' | 'date' | 'type'>;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE_LENGTH = 200;

/**
 * Validates a new transaction before it is saved.
 * Returns a list of human-readable error messages; an empty list means valid.
 */
export function validateNewExpense(input: NewExpenseInput): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    errors.push('Amount must be greater than $0.00.');
  }

  if (!input.category || !input.category.trim()) {
    errors.push('Please choose a valid category.');
  }

  if (!ISO_DATE_PATTERN.test(input.date) || Number.isNaN(new Date(input.date).getTime())) {
    errors.push('Please choose a valid date.');
  }

  if (input.note.length > MAX_NOTE_LENGTH) {
    errors.push(`Note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
  }

  if (input.type && input.type !== 'expense' && input.type !== 'income') {
    errors.push('Transaction type must be either expense or income.');
  }

  return errors;
}
