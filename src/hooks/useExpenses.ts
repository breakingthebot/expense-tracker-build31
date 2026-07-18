// src/hooks/useExpenses.ts
// Shared data hook for the Add, History, and Chart screens. Loads expenses,
// active recurring schedules, custom categories, monthly budget goals on focus.
// Coordinates generators and CRUD actions for transactions, schedules, categories,
// budget goals, and bulk CSV transaction imports.
// Connects to: src/services/expenseStorage.ts, src/services/recurringStorage.ts,
// src/services/recurringGenerator.ts, src/services/categoryStorage.ts,
// src/services/budgetStorage.ts, src/services/csvImport.ts, src/utils/date.ts
// Created: 2026-07-12

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, NewExpenseInput } from '../models/expense';
import { NewRecurringInput, RecurringExpense } from '../models/recurring';
import { Category, getCategories, addCategory, renameCategory, deleteCategory } from '../services/categoryStorage';
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
  importTransactions: (csvContent: string) => Promise<ValidationResult>;
}

export function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<Record<string, number>>({});
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

  return {
    expenses,
    recurringSchedules,
    categories,
    budgetGoals,
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
    importTransactions,
  };
}
