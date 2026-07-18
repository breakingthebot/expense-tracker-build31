// src/services/startingBalanceStorage.ts
// Manages AsyncStorage I/O for the user's starting cash balance and its starting date.
// Connects to: src/utils/logger.ts, src/utils/date.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { todayIsoDate } from '../utils/date';

const BALANCE_CENTS_KEY = '@expense_tracker/starting_balance';
const BALANCE_DATE_KEY = '@expense_tracker/starting_balance_date';
const SCOPE = 'startingBalanceStorage';

export interface StartingBalanceConfig {
  balanceCents: number;
  startDate: string;
}

/** Reads the current starting balance configuration from storage. */
export async function getStartingBalanceConfig(): Promise<StartingBalanceConfig> {
  try {
    const rawCents = await AsyncStorage.getItem(BALANCE_CENTS_KEY);
    const rawDate = await AsyncStorage.getItem(BALANCE_DATE_KEY);

    return {
      balanceCents: rawCents ? parseInt(rawCents, 10) : 0,
      startDate: rawDate || todayIsoDate(),
    };
  } catch (error) {
    logger.error(SCOPE, 'Failed to read starting balance config', { error: String(error) });
    return {
      balanceCents: 0,
      startDate: todayIsoDate(),
    };
  }
}

/** Saves the starting balance configuration to storage. */
export async function setStartingBalanceConfig(balanceCents: number, startDate: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BALANCE_CENTS_KEY, String(balanceCents));
    await AsyncStorage.setItem(BALANCE_DATE_KEY, startDate);
    logger.info(SCOPE, 'Starting balance config updated', { balanceCents, startDate });
  } catch (error) {
    logger.error(SCOPE, 'Failed to save starting balance config', { error: String(error) });
    throw new Error('Could not save starting balance. Please try again.');
  }
}

/** Clears/resets the starting balance config. */
export async function resetStartingBalanceConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BALANCE_CENTS_KEY);
    await AsyncStorage.removeItem(BALANCE_DATE_KEY);
    logger.info(SCOPE, 'Starting balance config reset');
  } catch (error) {
    logger.error(SCOPE, 'Failed to reset starting balance config', { error: String(error) });
  }
}
