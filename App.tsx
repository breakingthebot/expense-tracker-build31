// App.tsx
// App entry screen. Loads expenses from local storage on mount, and
// switches between the Add/List view and the Monthly Chart view with a
// simple toggle (no navigation library yet -- see BUILD_NOTES.md).
// Connects to: src/services/expenseStorage.ts, src/services/monthlySummary.ts,
// src/components/AddExpenseForm.tsx, src/components/ExpenseList.tsx, src/components/MonthlyChart.tsx
// Created: 2026-07-12

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AddExpenseForm from './src/components/AddExpenseForm';
import ExpenseList from './src/components/ExpenseList';
import MonthlyChart from './src/components/MonthlyChart';
import { Expense, NewExpenseInput } from './src/models/expense';
import { addExpense, deleteExpense, getAllExpenses } from './src/services/expenseStorage';
import { currentMonthKey, summarizeMonth } from './src/services/monthlySummary';
import { formatMonthLabel } from './src/utils/date';
import { logger } from './src/utils/logger';

const SCOPE = 'App';
type ViewMode = 'list' | 'chart';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const monthKey = useMemo(() => currentMonthKey(), []);
  const monthlySummary = useMemo(() => summarizeMonth(expenses, monthKey), [expenses, monthKey]);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    setLoadError(null);
    try {
      const stored = await getAllExpenses();
      setExpenses(stored);
    } catch (error) {
      logger.error(SCOPE, 'Failed to load expenses on mount', { error: String(error) });
      setLoadError(error instanceof Error ? error.message : 'Could not load your expenses.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense(input: NewExpenseInput) {
    setSubmitting(true);
    try {
      await addExpense(input);
      const stored = await getAllExpenses();
      setExpenses(stored);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteExpense(id: string) {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(id);
            const stored = await getAllExpenses();
            setExpenses(stored);
          } catch (error) {
            logger.error(SCOPE, 'Failed to delete expense', { error: String(error) });
            Alert.alert('Could not delete expense', 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'list' }}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'chart' && styles.toggleButtonActive]}
          onPress={() => setViewMode('chart')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'chart' }}
        >
          <Text style={[styles.toggleText, viewMode === 'chart' && styles.toggleTextActive]}>
            Chart
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator style={styles.loadingIndicator} size="large" color="#2f6feb" />
      )}
      {!loading && loadError && <Text style={styles.errorText}>{loadError}</Text>}

      {!loading && !loadError && viewMode === 'list' && (
        <>
          <AddExpenseForm onSubmit={handleAddExpense} submitting={submitting} />
          <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
        </>
      )}

      {!loading && !loadError && viewMode === 'chart' && (
        <MonthlyChart summary={monthlySummary} monthLabel={formatMonthLabel(monthKey)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  toggleButtonActive: {
    backgroundColor: '#2f6feb',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  toggleTextActive: {
    color: '#fff',
  },
  loadingIndicator: {
    marginTop: 32,
  },
  errorText: {
    color: '#c0392b',
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
});
