// src/services/themeStorage.ts
// Persists the chosen theme ('light' | 'dark' | 'oled') to AsyncStorage.
// Connects to: src/components/ThemeProvider.tsx, src/utils/logger.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

export type AppTheme = 'light' | 'dark' | 'oled';

const STORAGE_KEY = '@expense_tracker/theme';
const SCOPE = 'themeStorage';

/** Loads the theme preference from storage, defaulting to 'light' if not found. */
export async function getSavedTheme(): Promise<AppTheme> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'oled') {
      return value as AppTheme;
    }
    return 'light';
  } catch (error) {
    logger.error(SCOPE, 'Failed to read theme from storage', { error: String(error) });
    return 'light';
  }
}

/** Saves the theme preference to storage. */
export async function saveTheme(theme: AppTheme): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, theme);
    logger.info(SCOPE, 'Theme configuration updated', { theme });
  } catch (error) {
    logger.error(SCOPE, 'Failed to save theme to storage', { error: String(error) });
  }
}
