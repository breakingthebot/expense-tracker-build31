// tests/services/demoSeeder.test.ts
// Unit tests for the onboarding demo data seeder service.
// Mirrors: src/services/demoSeeder.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedDemoData, clearAllData } from '../../src/services/demoSeeder';

describe('demoSeeder', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('populates correct mock storage data', async () => {
    const expensesBefore = await AsyncStorage.getItem('@expense_tracker/expenses');
    expect(expensesBefore).toBeNull();

    await seedDemoData();

    const expensesAfter = await AsyncStorage.getItem('@expense_tracker/expenses');
    expect(expensesAfter).not.toBeNull();
    const parsedExp = JSON.parse(expensesAfter!);
    expect(parsedExp.length).toBe(9);

    const recurringAfter = await AsyncStorage.getItem('@expense_tracker/recurring_schedules');
    const parsedRec = JSON.parse(recurringAfter!);
    expect(parsedRec.length).toBe(2);

    const budgetsAfter = await AsyncStorage.getItem('@expense_tracker/budget_goals');
    const parsedBudgets = JSON.parse(budgetsAfter!);
    expect(parsedBudgets.Food).toBe(40000);
  });

  it('wipes database correct mock storage data', async () => {
    await seedDemoData();
    await AsyncStorage.setItem('@expense_tracker/starting_balance', '1000');
    await AsyncStorage.setItem('@expense_tracker/starting_balance_date', '2026-07-01');
    await AsyncStorage.setItem('@expense_tracker/weekly_spending_goal', '15000');

    await clearAllData();

    const expenses = await AsyncStorage.getItem('@expense_tracker/expenses');
    expect(expenses).toBeNull();

    const recurring = await AsyncStorage.getItem('@expense_tracker/recurring_schedules');
    expect(recurring).toBeNull();

    const budgets = await AsyncStorage.getItem('@expense_tracker/budget_goals');
    expect(budgets).toBeNull();

    const bal = await AsyncStorage.getItem('@expense_tracker/starting_balance');
    expect(bal).toBeNull();

    const weeklyGoal = await AsyncStorage.getItem('@expense_tracker/weekly_spending_goal');
    expect(weeklyGoal).toBeNull();
  });
});
