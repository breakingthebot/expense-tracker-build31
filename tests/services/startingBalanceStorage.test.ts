// tests/services/startingBalanceStorage.test.ts
// Tests starting balance storage configuration settings.
// Mirrors: src/services/startingBalanceStorage.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStartingBalanceConfig,
  setStartingBalanceConfig,
  resetStartingBalanceConfig,
} from '../../src/services/startingBalanceStorage';

describe('startingBalanceStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns default config when storage is empty', async () => {
    const config = await getStartingBalanceConfig();
    expect(config.balanceCents).toBe(0);
    expect(config.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('saves and reads starting balance configuration correctly', async () => {
    await setStartingBalanceConfig(250000, '2026-07-01');
    const config = await getStartingBalanceConfig();
    expect(config.balanceCents).toBe(250000);
    expect(config.startDate).toBe('2026-07-01');
  });

  it('resets starting balance settings back to defaults', async () => {
    await setStartingBalanceConfig(150000, '2026-06-15');
    await resetStartingBalanceConfig();
    const config = await getStartingBalanceConfig();
    expect(config.balanceCents).toBe(0);
  });
});
