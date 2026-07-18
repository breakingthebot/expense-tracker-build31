// tests/services/budgetStorage.test.ts
// Unit tests for the monthly spending limits (budget goals) storage service.
// Connects to: src/services/budgetStorage.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBudgetGoals, setBudgetGoal, deleteBudgetGoal } from '../../src/services/budgetStorage';

describe('budgetStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns empty dictionary by default', async () => {
    const goals = await getBudgetGoals();
    expect(goals).toEqual({});
  });

  it('sets, updates, and reads budget goals correctly', async () => {
    // Set first goal
    await setBudgetGoal('Food', 50000); // $500.00
    let goals = await getBudgetGoals();
    expect(goals).toEqual({ Food: 50000 });

    // Set second goal
    await setBudgetGoal('Utilities', 15000); // $150.00
    goals = await getBudgetGoals();
    expect(goals).toEqual({ Food: 50000, Utilities: 15000 });

    // Update goal
    await setBudgetGoal('Food', 60000); // $600.00
    goals = await getBudgetGoals();
    expect(goals).toEqual({ Food: 60000, Utilities: 15000 });
  });

  it('deletes goals when deleteBudgetGoal is called or limit is set to <= 0', async () => {
    await setBudgetGoal('Food', 50000);
    await setBudgetGoal('Utilities', 15000);

    // Delete first goal using deleteBudgetGoal
    await deleteBudgetGoal('Food');
    let goals = await getBudgetGoals();
    expect(goals).toEqual({ Utilities: 15000 });

    // Delete second goal by setting to 0
    await setBudgetGoal('Utilities', 0);
    goals = await getBudgetGoals();
    expect(goals).toEqual({});
  });
});
