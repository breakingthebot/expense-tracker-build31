// tests/services/themeStorage.test.ts
// Unit tests for theme preference storage services.
// Connects to: src/services/themeStorage.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedTheme, saveTheme } from '../../src/services/themeStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('themeStorage', () => {
  it('returns light theme by default if none is stored', async () => {
    const theme = await getSavedTheme();
    expect(theme).toBe('light');
  });

  it('saves and reads user theme preference correctly', async () => {
    await saveTheme('dark');
    let theme = await getSavedTheme();
    expect(theme).toBe('dark');

    await saveTheme('oled');
    theme = await getSavedTheme();
    expect(theme).toBe('oled');
  });

  it('safely fallback to light when malformed value is read', async () => {
    await AsyncStorage.setItem('@expense_tracker/theme', 'invalid-theme-value');
    const theme = await getSavedTheme();
    expect(theme).toBe('light');
  });
});
