// src/hooks/useExpenses.ts
// Shared data hook for the Add, History, and Chart screens. Loads expenses,
// active recurring schedules, custom categories, and monthly budget goals on focus.
// Executes the recurring expense generator to catch up on any due items, and exposes
// CRUD operations for transactions, schedules, categories, and budget goals.
// Connects to: src/services/expenseStorage.ts, src/services/recurringStorage.ts,
// src/services/recurringGenerator.ts, src/services/categoryStorage.ts, src/services/budgetStorage.ts, src/utils/date.ts
// Created: 2026-07-12

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, NewExpenseInput } from '../models/expense';
import { NewRecurringInput, RecurringExpense } from '../models/recurring';
import { Category } from '../services/categoryStorage';
import { getBudgetGoals, setBudgetGoal } from '../services/budgetStorage';
import {
  addExpense,
  deleteExpense,
  getAllExpenses,
  updateExpense,
} from '../services/expenseStorage';
import {
  addRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  saveSchedulesAndExpenses,
} from '../services/recurringStorage';
import {
  getCategories,
  addCategory,
  renameCategory,
  deleteCategory,
} from '../services/categoryStorage';
import { generateExpensesFromSchedules } from '../services/recurringGenerator';
import { todayIsoDate } from '../utils/date';
import { logger } from '../utils/logger';

const SCOPE = 'useExpenses';

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
  };
}
