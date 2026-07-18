// src/hooks/useExpenses.ts
// Shared data hook for the Add, History, and Chart screens. Loads expenses,
// active recurring schedules, custom categories, monthly budget goals on focus.
// Coordinates generators and CRUD actions for transactions, schedules, categories,
// budget goals, bulk CSV transaction imports, and default transaction type preferences.
// Connects to: src/services/expenseStorage.ts, src/services/recurringStorage.ts,
// src/services/recurringGenerator.ts, src/services/categoryStorage.ts,
// src/services/budgetStorage.ts, src/services/csvImport.ts, src/utils/date.ts
// Created: 2026-07-12

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, NewExpenseInput, TransactionType } from '../models/expense';
import { NewRecurringInput, RecurringExpense } from '../models/recurring';
import { Category, getCategories, addCategory, renameCategory, deleteCategory, reorderCategories } from '../services/categoryStorage';
import { getBudgetGoals, setBudgetGoal } from '../services/budgetStorage';
import {
  addExpense,
  deleteExpense,
  getAllExpenses,
  updateExpense,
  addExpensesBulk,
} from '../services/expenseStorage';
import {
  addRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  saveSchedulesAndExpenses,
} from '../services/recurringStorage';
import { generateExpensesFromSchedules } from '../services/recurringGenerator';
import { validateCsvImport, ValidationResult } from '../services/csvImport';
import { todayIsoDate } from '../utils/date';
import { seedDemoData, clearAllData } from '../services/demoSeeder';
import { getStartingBalanceConfig, setStartingBalanceConfig } from '../services/startingBalanceStorage';
import { getWeeklySpendingGoal, setWeeklySpendingGoal as setWeeklySpendingGoalConfig } from '../services/weeklyGoalStorage';
import { logger } from '../utils/logger';

const SCOPE = 'useExpenses';

const IMPORT_PALETTE_COLORS = [
  '#e34948', // Red
  '#e87ba4', // Pink
  '#4a3aa7', // Purple
  '#2a78d6', // Blue
  '#00a8cc', // Teal
  '#1baf7a', // Green
  '#008300', // Dark Green
  '#eda100', // Yellow
  '#eb6834', // Orange
  '#3f51b5', // Indigo
];

interface UseExpensesResult {
  expenses: Expense[];
  recurringSchedules: RecurringExpense[];
  categories: Category[];
  budgetGoals: Record<string, number>;
  defaultTxType: TransactionType;
  startingBalance: number;
  startingBalanceDate: string;
  weeklySpendingGoal: number;
  loading: boolean;
  loadError: string | null;
  submitting: boolean;
  addNewExpense: (input: NewExpenseInput) => Promise<void>;
  editExpense: (id: string, input: NewExpenseInput) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addNewRecurringExpense: (input: NewRecurringInput) => Promise<void>;
  removeRecurringExpense: (id: string) => Promise<void>;
  addNewCategory: (name: string, color: string) => Promise<void>;
  editCategoryName: (id: string, newName: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  updateBudgetGoal: (category: string, limitCents: number) => Promise<void>;
  updateStartingBalance: (balanceCents: number, startDate: string) => Promise<void>;
  updateWeeklySpendingGoal: (limitCents: number) => Promise<void>;
  importTransactions: (csvContent: string) => Promise<ValidationResult>;
  setDefaultTxType: (type: TransactionType) => Promise<void>;
  reorderCategoriesList: (orderedIds: string[]) => Promise<void>;
  seedDemoDataList: () => Promise<void>;
  wipeAllStorageData: () => Promise<void>;
  demoSeeded: boolean;
}

export function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<Record<string, number>>({});
  const [defaultTxType, setDefaultTxTypeState] = useState<TransactionType>('expense');
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [startingBalanceDate, setStartingBalanceDate] = useState<string>('');
  const [weeklySpendingGoal, setWeeklySpendingGoal] = useState<number>(0);
  const [demoSeeded, setDemoSeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Fetch custom/default categories list
      const storedCategories = await getCategories();
      setCategories(storedCategories);

      // 2. Fetch active recurring schedules
      const schedules = await getRecurringExpenses();

      // 3. Check and generate any due recurring transaction instances
      const todayStr = todayIsoDate();
      const { generatedExpenses, updatedSchedules } = generateExpensesFromSchedules(
        schedules,
        todayStr
      );

      if (generatedExpenses.length > 0) {
        // 4. Batch save new expenses and updated schedules to storage
        await saveSchedulesAndExpenses(updatedSchedules, generatedExpenses);
        setRecurringSchedules(updatedSchedules);
      } else {
        setRecurringSchedules(schedules);
      }

      // 5. Fetch the full list of sorted expenses
      const stored = await getAllExpenses();
      setExpenses(stored);

      // 6. Fetch monthly category budget goals
      const goals = await getBudgetGoals();
      setBudgetGoals(goals);

      // 7. Load default transaction type preference
      const savedType = await AsyncStorage.getItem('@expense_tracker/default_tx_type');
      if (savedType === 'expense' || savedType === 'income') {
        setDefaultTxTypeState(savedType as TransactionType);
      }

      // 8. Load onboarding demo status
      const seeded = await AsyncStorage.getItem('@expense_tracker/demo_seeded');
      setDemoSeeded(seeded === 'true');

      // 9. Load starting balance configurations
      const startingBalConfig = await getStartingBalanceConfig();
      setStartingBalance(startingBalConfig.balanceCents);
      setStartingBalanceDate(startingBalConfig.startDate);

      // 10. Load weekly spending goal
      const weeklyGoalCents = await getWeeklySpendingGoal();
      setWeeklySpendingGoal(weeklyGoalCents);
    } catch (error) {
      logger.error(SCOPE, 'Failed to load expenses, schedules, categories, or budgets', { error: String(error) });
      setLoadError(error instanceof Error ? error.message : 'Could not load your data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function addNewExpense(input: NewExpenseInput) {
    setSubmitting(true);
    try {
      await addExpense(input);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function editExpense(id: string, input: NewExpenseInput) {
    setSubmitting(true);
    try {
      await updateExpense(id, input);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeExpense(id: string) {
    await deleteExpense(id);
    await refresh();
  }

  async function addNewRecurringExpense(input: NewRecurringInput) {
    setSubmitting(true);
    try {
      await addRecurringExpense(input);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeRecurringExpense(id: string) {
    await deleteRecurringExpense(id);
    await refresh();
  }

  async function addNewCategory(name: string, color: string) {
    setSubmitting(true);
    try {
      await addCategory(name, color);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function editCategoryName(id: string, newName: string) {
    setSubmitting(true);
    try {
      await renameCategory(id, newName);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeCategory(id: string) {
    setSubmitting(true);
    try {
      await deleteCategory(id);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateBudgetGoal(category: string, limitCents: number) {
    setSubmitting(true);
    try {
      await setBudgetGoal(category, limitCents);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function importTransactions(csvContent: string): Promise<ValidationResult> {
    setSubmitting(true);
    try {
      const storedExpenses = await getAllExpenses();
      const storedCategories = await getCategories();
      const categoryNames = storedCategories.map((c) => c.name);

      const validation = validateCsvImport(csvContent, storedExpenses, categoryNames);

      if (validation.hasErrors || validation.validTransactions.length === 0) {
        return validation;
      }

      // Step 1: Auto-create missing categories
      let colorIndex = storedCategories.length % IMPORT_PALETTE_COLORS.length;
      for (const catName of validation.importedCategories) {
        const assignedColor = IMPORT_PALETTE_COLORS[colorIndex];
        await addCategory(catName, assignedColor);
        colorIndex = (colorIndex + 1) % IMPORT_PALETTE_COLORS.length;
      }

      // Step 2: Batch import valid transactions in a single write call
      await addExpensesBulk(validation.validTransactions);
      
      await refresh();
      return validation;
    } catch (error) {
      logger.error(SCOPE, 'CSV Bulk Import failed', { error: String(error) });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  async function setDefaultTxType(type: TransactionType) {
    try {
      setDefaultTxTypeState(type);
      await AsyncStorage.setItem('@expense_tracker/default_tx_type', type);
      logger.info(SCOPE, 'Default transaction type updated', { type });
    } catch (error) {
      logger.error(SCOPE, 'Failed to save default transaction type', { error: String(error) });
    }
  }

  async function reorderCategoriesList(orderedIds: string[]) {
    setSubmitting(true);
    try {
      await reorderCategories(orderedIds);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function seedDemoDataList() {
    setSubmitting(true);
    try {
      await seedDemoData();
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function wipeAllStorageData() {
    setSubmitting(true);
    try {
      await clearAllData();
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStartingBalance(balanceCents: number, startDate: string) {
    setSubmitting(true);
    try {
      await setStartingBalanceConfig(balanceCents, startDate);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateWeeklySpendingGoal(limitCents: number) {
    setSubmitting(true);
    try {
      await setWeeklySpendingGoalConfig(limitCents);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return {
    expenses,
    recurringSchedules,
    categories,
    budgetGoals,
    defaultTxType,
    startingBalance,
    startingBalanceDate,
    weeklySpendingGoal,
    demoSeeded,
    loading,
    loadError,
    submitting,
    addNewExpense,
    editExpense,
    removeExpense,
    addNewRecurringExpense,
    removeRecurringExpense,
    addNewCategory,
    editCategoryName,
    removeCategory,
    updateBudgetGoal,
    updateStartingBalance,
    updateWeeklySpendingGoal,
    importTransactions,
    setDefaultTxType,
    reorderCategoriesList,
    seedDemoDataList,
    wipeAllStorageData,
  };
}
