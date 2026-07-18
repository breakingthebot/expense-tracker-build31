// src/hooks/useExpenses.ts
// Shared data hook for the Add, History, and Chart screens. Loads expenses and
// active recurring schedules on focus, executes the recurring expense generator
// to catch up on any due items, and exposes CRUD operations for both single
// transactions and recurring schedules.
// Connects to: src/services/expenseStorage.ts, src/services/recurringStorage.ts,
// src/services/recurringGenerator.ts, src/utils/date.ts
// Created: 2026-07-12

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, NewExpenseInput } from '../models/expense';
import { NewRecurringInput, RecurringExpense } from '../models/recurring';
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
import { generateExpensesFromSchedules } from '../services/recurringGenerator';
import { todayIsoDate } from '../utils/date';
import { logger } from '../utils/logger';

const SCOPE = 'useExpenses';

interface UseExpensesResult {
  expenses: Expense[];
  recurringSchedules: RecurringExpense[];
  loading: boolean;
  loadError: string | null;
  submitting: boolean;
  addNewExpense: (input: NewExpenseInput) => Promise<void>;
  editExpense: (id: string, input: NewExpenseInput) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addNewRecurringExpense: (input: NewRecurringInput) => Promise<void>;
  removeRecurringExpense: (id: string) => Promise<void>;
}

export function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Fetch active recurring schedules
      const schedules = await getRecurringExpenses();

      // 2. Check and generate any due recurring transaction instances
      const todayStr = todayIsoDate();
      const { generatedExpenses, updatedSchedules } = generateExpensesFromSchedules(
        schedules,
        todayStr
      );

      if (generatedExpenses.length > 0) {
        // 3. Batch save new expenses and updated schedules to storage
        await saveSchedulesAndExpenses(updatedSchedules, generatedExpenses);
        setRecurringSchedules(updatedSchedules);
      } else {
        setRecurringSchedules(schedules);
      }

      // 4. Fetch the full list of sorted expenses
      const stored = await getAllExpenses();
      setExpenses(stored);
    } catch (error) {
      logger.error(SCOPE, 'Failed to load expenses or process recurring schedules', { error: String(error) });
      setLoadError(error instanceof Error ? error.message : 'Could not load your expenses.');
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

  return {
    expenses,
    recurringSchedules,
    loading,
    loadError,
    submitting,
    addNewExpense,
    editExpense,
    removeExpense,
    addNewRecurringExpense,
    removeRecurringExpense,
  };
}
