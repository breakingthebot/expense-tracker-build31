// tests/services/weeklyGoalStorage.test.ts
// Unit tests for the weekly spending goal storage service.
// Mirrors: src/services/weeklyGoalStorage.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWeeklySpendingGoal, setWeeklySpendingGoal } from '../../src/services/weeklyGoalStorage';

describe('weeklyGoalStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns 0 when no weekly spending goal is set', async () => {
    const goal = await getWeeklySpendingGoal();
    expect(goal).toBe(0);
  });

  it('saves and reads weekly spending goal limit correctly', async () => {
    await setWeeklySpendingGoal(15000); // $150
    const goal = await getWeeklySpendingGoal();
    expect(goal).toBe(15000);
  });

  it('sets negative values to 0', async () => {
    await setWeeklySpendingGoal(-500);
    const goal = await getWeeklySpendingGoal();
    expect(goal).toBe(0);
  });
});
