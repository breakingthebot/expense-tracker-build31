// src/services/recurringStorage.ts
// Handles AsyncStorage I/O for recurring expense schedules.
// Connects to: src/models/recurring.ts, src/models/expense.ts, src/utils/logger.ts, src/utils/id.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecurringExpense, NewRecurringInput, validateRecurringInput } from '../models/recurring';
import { Expense } from '../models/expense';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';

const RECURRING_STORAGE_KEY = '@expense_tracker/recurring_schedules';
const EXPENSES_STORAGE_KEY = '@expense_tracker/expenses';
const SCOPE = 'recurringStorage';

/** Reads all active recurring schedules from storage. */
export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  try {
    const raw = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecurringExpense[]) : [];
  } catch (error) {
    logger.error(SCOPE, 'Failed to read recurring schedules', { error: String(error) });
    throw new Error('Could not load recurring schedules. Please try again.');
  }
}

/** Saves a list of recurring schedules. */
async function writeAllSchedules(schedules: RecurringExpense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(schedules));
  } catch (error) {
    logger.error(SCOPE, 'Failed to write recurring schedules', { error: String(error) });
    throw new Error('Could not save schedules. Please try again.');
  }
}

/** Adds a new recurring expense schedule. */
export async function addRecurringExpense(input: NewRecurringInput): Promise<RecurringExpense> {
  validateRecurringInput(input);

  const schedules = await getRecurringExpenses();
  const newSchedule: RecurringExpense = {
    id: generateId(),
    amountCents: input.amountCents,
    category: input.category,
    note: input.note,
    interval: input.interval,
    startDate: input.startDate,
    lastGeneratedDate: null, // initially null so the first generation triggers
    createdAt: new Date().toISOString(),
  };

  schedules.push(newSchedule);
  await writeAllSchedules(schedules);

  logger.info(SCOPE, 'Recurring schedule added', { id: newSchedule.id, interval: newSchedule.interval });
  return newSchedule;
}

/** Deletes a recurring expense schedule by ID. */
export async function deleteRecurringExpense(id: string): Promise<void> {
  const schedules = await getRecurringExpenses();
  const filtered = schedules.filter((s) => s.id !== id);

  if (filtered.length === schedules.length) {
    logger.warn(SCOPE, 'Attempted to delete a recurring schedule that was not found', { id });
    return;
  }

  await writeAllSchedules(filtered);
  logger.info(SCOPE, 'Recurring schedule deleted', { id });
}

/**
 * Saves both updated schedules and newly generated expenses to storage in a batch.
 * This keeps both collections synchronized.
 */
export async function saveSchedulesAndExpenses(
  updatedSchedules: RecurringExpense[],
  newExpenses: Expense[]
): Promise<void> {
  try {
    // Read existing expenses first to append new ones
    const rawExpenses = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
    const existingExpenses: Expense[] = rawExpenses ? JSON.parse(rawExpenses) : [];
    const combinedExpenses = [...existingExpenses, ...newExpenses];

    // Batch save
    await AsyncStorage.multiSet([
      [RECURRING_STORAGE_KEY, JSON.stringify(updatedSchedules)],
      [EXPENSES_STORAGE_KEY, JSON.stringify(combinedExpenses)],
    ]);

    logger.info(SCOPE, 'Batch generator updates saved', {
      schedulesUpdated: updatedSchedules.length,
      newExpensesCount: newExpenses.length,
    });
  } catch (error) {
    logger.error(SCOPE, 'Failed to save batch generator updates', { error: String(error) });
    throw new Error('Failed to update recurring transactions. Please try again.');
  }
}
