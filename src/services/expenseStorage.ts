// src/services/expenseStorage.ts
// Persists expenses to the device's local storage (AsyncStorage) as a single
// JSON array. This is the only module that touches AsyncStorage for
// expenses — components go through these functions, never AsyncStorage
// directly.
// Connects to: src/models/expense.ts, src/utils/logger.ts, App.tsx
// Created: 2026-07-12

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, NewExpenseInput, validateNewExpense } from '../models/expense';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';

const STORAGE_KEY = '@expense_tracker/expenses';
const SCOPE = 'expenseStorage';

async function readAll(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Expense[]) : [];
  } catch (error) {
    logger.error(SCOPE, 'Failed to read expenses from storage', { error: String(error) });
    throw new Error('Could not load your expenses. Please try again.');
  }
}

async function writeAll(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    logger.error(SCOPE, 'Failed to save expenses to storage', { error: String(error) });
    throw new Error('Could not save your expense. Please try again.');
  }
}



/** Returns all expenses, most recent date first. */
export async function getAllExpenses(): Promise<Expense[]> {
  const expenses = await readAll();
  return [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
  );
}

/**
 * Validates and saves a new expense.
 * Throws an Error with a user-facing message if validation or storage fails.
 */
export async function addExpense(input: NewExpenseInput): Promise<Expense> {
  const errors = validateNewExpense(input);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const expense: Expense = {
    id: generateId(),
    amountCents: input.amountCents,
    category: input.category,
    note: input.note.trim(),
    date: input.date,
    type: input.type ?? 'expense',
    createdAt: new Date().toISOString(),
  };

  const existing = await readAll();
  await writeAll([...existing, expense]);
  logger.info(SCOPE, 'Expense added', { id: expense.id, category: expense.category });
  return expense;
}

/** Saves a batch of validated new transactions atomically in a single write. */
export async function addExpensesBulk(inputs: NewExpenseInput[]): Promise<Expense[]> {
  const nowStr = new Date().toISOString();
  const newExpenses: Expense[] = inputs.map((input) => ({
    id: generateId(),
    amountCents: input.amountCents,
    category: input.category,
    note: input.note.trim(),
    date: input.date,
    type: input.type ?? 'expense',
    createdAt: nowStr,
  }));

  const existing = await readAll();
  await writeAll([...existing, ...newExpenses]);
  logger.info(SCOPE, 'Bulk transactions added', { count: newExpenses.length });
  return newExpenses;
}

/**
 * Validates and saves changes to an existing expense, keeping its id and
 * original createdAt. Throws a user-facing error if validation fails or the
 * id doesn't exist.
 */
export async function updateExpense(id: string, input: NewExpenseInput): Promise<Expense> {
  const errors = validateNewExpense(input);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const existing = await readAll();
  const index = existing.findIndex((expense) => expense.id === id);
  if (index === -1) {
    logger.error(SCOPE, 'Attempted to update an expense that was not found', { id });
    throw new Error('That expense no longer exists.');
  }

  const updated: Expense = {
    ...existing[index],
    amountCents: input.amountCents,
    category: input.category,
    note: input.note.trim(),
    date: input.date,
    type: input.type,
  };

  const next = [...existing];
  next[index] = updated;
  await writeAll(next);
  logger.info(SCOPE, 'Expense updated', { id });
  return updated;
}

/** Deletes an expense by id. No-op (with a warning log) if the id is not found. */
export async function deleteExpense(id: string): Promise<void> {
  const existing = await readAll();
  const remaining = existing.filter((expense) => expense.id !== id);

  if (remaining.length === existing.length) {
    logger.warn(SCOPE, 'Attempted to delete an expense that was not found', { id });
    return;
  }

  await writeAll(remaining);
  logger.info(SCOPE, 'Expense deleted', { id });
}
