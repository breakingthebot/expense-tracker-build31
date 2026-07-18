// src/services/budgetStorage.ts
// Manages AsyncStorage I/O for monthly spending limits (budget goals) per category.
// Connects to: src/utils/logger.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const BUDGETS_STORAGE_KEY = '@expense_tracker/budget_goals';
const SCOPE = 'budgetStorage';

/**
 * Returns a dictionary mapping category names to their monthly limit in cents.
 * e.g., { Food: 50000, Transportation: 25000 }
 */
export async function getBudgetGoals(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    logger.error(SCOPE, 'Failed to read budget goals from storage', { error: String(error) });
    return {};
  }
}

/** Sets or updates the budget limit in cents for a given category name. */
export async function setBudgetGoal(category: string, limitCents: number): Promise<void> {
  try {
    const goals = await getBudgetGoals();
    if (limitCents <= 0) {
      delete goals[category];
    } else {
      goals[category] = limitCents;
    }
    await AsyncStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(goals));
    logger.info(SCOPE, 'Budget goal updated', { category, limitCents });
  } catch (error) {
    logger.error(SCOPE, 'Failed to save budget goal', { category, error: String(error) });
    throw new Error('Could not save budget goal. Please try again.');
  }
}

/** Clears the budget goal for a given category name. */
export async function deleteBudgetGoal(category: string): Promise<void> {
  await setBudgetGoal(category, 0);
}
