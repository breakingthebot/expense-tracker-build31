// src/services/demoSeeder.ts
// Seeds a comprehensive set of mock transactions, active recurring templates,
// and category budgets to allow immediate system exploration on a clean slate.
// Connects to: src/models/expense.ts, src/models/recurring.ts, src/utils/date.ts, src/utils/id.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../models/expense';
import { RecurringExpense } from '../models/recurring';
import { addDaysToIso, todayIsoDate } from '../utils/date';
import { generateId } from '../utils/id';

const EXPENSES_STORAGE_KEY = '@expense_tracker/expenses';
const RECURRING_STORAGE_KEY = '@expense_tracker/recurring_schedules';
const BUDGETS_STORAGE_KEY = '@expense_tracker/budget_goals';

/** Populates the database keys with a premium set of mock finance entries. */
export async function seedDemoData(): Promise<void> {
  const today = todayIsoDate();

  const demoExpenses: Expense[] = [
    {
      id: `exp-${generateId()}`,
      amountCents: 8450,
      category: 'Food',
      note: 'Weekly Groceries',
      date: addDaysToIso(today, -5),
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 4200,
      category: 'Transportation',
      note: 'Gas Station fill-up',
      date: addDaysToIso(today, -4),
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 1599,
      category: 'Entertainment',
      note: 'Netflix Subscription',
      date: addDaysToIso(today, -3),
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 950,
      category: 'Food',
      note: 'Coffee with Team',
      date: addDaysToIso(today, -2),
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 240000,
      category: 'Other',
      note: 'Bi-weekly Salary',
      date: addDaysToIso(today, -1),
      type: 'income',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 6500,
      category: 'Utilities',
      note: 'Electricity Bill',
      date: today,
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 1450,
      category: 'Food',
      note: 'Lunch Salad',
      date: today,
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 7999,
      category: 'Utilities',
      note: 'Internet Service Provider',
      date: addDaysToIso(today, 2),
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `exp-${generateId()}`,
      amountCents: 2999,
      category: 'Health',
      note: 'Gym Membership',
      date: addDaysToIso(today, 5),
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
  ];

  const demoSchedules: RecurringExpense[] = [
    {
      id: `rec-${generateId()}`,
      amountCents: 999,
      category: 'Entertainment',
      note: 'Music streaming sub',
      interval: 'weekly',
      startDate: today,
      lastGeneratedDate: today,
      type: 'expense',
      createdAt: new Date().toISOString(),
    },
    {
      id: `rec-${generateId()}`,
      amountCents: 240000,
      category: 'Other',
      note: 'Salary Paycheck',
      interval: 'monthly',
      startDate: today,
      lastGeneratedDate: today,
      type: 'income',
      createdAt: new Date().toISOString(),
    },
  ];

  const demoBudgets: Record<string, number> = {
    Food: 40000,
    Transportation: 15000,
    Utilities: 20000,
  };

  await AsyncStorage.multiSet([
    [EXPENSES_STORAGE_KEY, JSON.stringify(demoExpenses)],
    [RECURRING_STORAGE_KEY, JSON.stringify(demoSchedules)],
    [BUDGETS_STORAGE_KEY, JSON.stringify(demoBudgets)],
    ['@expense_tracker/demo_seeded', 'true'],
  ]);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    EXPENSES_STORAGE_KEY,
    RECURRING_STORAGE_KEY,
    BUDGETS_STORAGE_KEY,
    '@expense_tracker/demo_seeded',
    '@expense_tracker/starting_balance',
    '@expense_tracker/starting_balance_date',
    '@expense_tracker/weekly_spending_goal',
  ]);
}
