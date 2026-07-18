// src/models/recurring.ts
// Data models and validation for recurring expense schedules.
// Connects to: src/config/categories.ts
// Created: 2026-07-18

import { ExpenseCategory } from '../config/categories';
import { TransactionType } from './expense';

export type RecurringInterval =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'six_months'
  | 'yearly';

export interface RecurringExpense {
  id: string;
  amountCents: number;
  category: ExpenseCategory;
  note: string;
  interval: RecurringInterval;
  startDate: string; // yyyy-mm-dd
  lastGeneratedDate: string | null; // yyyy-mm-dd
  createdAt: string; // ISO timestamp
  type?: TransactionType;
}

export interface NewRecurringInput {
  amountCents: number;
  category: ExpenseCategory;
  note: string;
  interval: RecurringInterval;
  startDate: string; // yyyy-mm-dd
  type?: TransactionType;
}

/** Validates inputs for a recurring schedule. Throws Error if invalid. */
export function validateRecurringInput(input: NewRecurringInput): void {
  if (input.amountCents <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (!input.note.trim()) {
    throw new Error('Note is required for recurring expenses.');
  }
  if (input.note.length > 100) {
    throw new Error('Note must be 100 characters or less.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    throw new Error('Start date must be in YYYY-MM-DD format.');
  }
  const dateObj = new Date(input.startDate + 'T00:00:00');
  if (isNaN(dateObj.getTime())) {
    throw new Error('Start date is invalid.');
  }
}
