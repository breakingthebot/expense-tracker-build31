// src/services/weeklyGoalStorage.ts
// Manages AsyncStorage I/O for the global weekly spending goal threshold.
// Connects to: src/utils/logger.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const WEEKLY_GOAL_STORAGE_KEY = '@expense_tracker/weekly_spending_goal';
const SCOPE = 'weeklyGoalStorage';

/**
 * Returns the global weekly spending limit in cents (0 indicates no limit set).
 */
export async function getWeeklySpendingGoal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(WEEKLY_GOAL_STORAGE_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch (error) {
    logger.error(SCOPE, 'Failed to read weekly spending goal from storage', { error: String(error) });
    return 0;
  }
}

/**
 * Sets or updates the global weekly spending limit in cents.
 */
export async function setWeeklySpendingGoal(limitCents: number): Promise<void> {
  try {
    if (limitCents < 0) {
      limitCents = 0;
    }
    await AsyncStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, String(limitCents));
    logger.info(SCOPE, 'Weekly spending goal updated', { limitCents });
  } catch (error) {
    logger.error(SCOPE, 'Failed to save weekly spending goal', { limitCents, error: String(error) });
    throw new Error('Could not save weekly spending goal. Please try again.');
  }
}
