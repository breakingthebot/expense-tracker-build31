// src/hooks/useExpenses.ts
// Shared data hook for the Expenses and Chart screens. Loads expenses on
// mount and re-loads every time the owning screen regains focus (so adding
// an expense on one tab shows up immediately when you switch to the other),
// and exposes add/delete actions that refresh state afterward.
// Connects to: src/services/expenseStorage.ts, src/screens/ExpensesScreen.tsx, src/screens/ChartScreen.tsx
// Created: 2026-07-12

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, NewExpenseInput } from '../models/expense';
import { addExpense, deleteExpense, getAllExpenses } from '../services/expenseStorage';
import { logger } from '../utils/logger';

const SCOPE = 'useExpenses';

interface UseExpensesResult {
  expenses: Expense[];
  loading: boolean;
  loadError: string | null;
  submitting: boolean;
  addNewExpense: (input: NewExpenseInput) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
}

export function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const stored = await getAllExpenses();
      setExpenses(stored);
    } catch (error) {
      logger.error(SCOPE, 'Failed to load expenses', { error: String(error) });
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

  async function removeExpense(id: string) {
    await deleteExpense(id);
    await refresh();
  }

  return { expenses, loading, loadError, submitting, addNewExpense, removeExpense };
}
