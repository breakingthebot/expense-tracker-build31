// App.tsx
// App entry screen. Loads expenses from local storage on mount, and wires
// the Add Expense form and the Expense list to the storage service.
// Connects to: src/services/expenseStorage.ts, src/components/AddExpenseForm.tsx,
// src/components/ExpenseList.tsx
// Created: 2026-07-12

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AddExpenseForm from './src/components/AddExpenseForm';
import ExpenseList from './src/components/ExpenseList';
import { Expense, NewExpenseInput } from './src/models/expense';
import { addExpense, deleteExpense, getAllExpenses } from './src/services/expenseStorage';
import { logger } from './src/utils/logger';

const SCOPE = 'App';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <AddExpenseForm onSubmit={handleAddExpense} submitting={submitting} />
      {loading && (
        <ActivityIndicator style={styles.loadingIndicator} size="large" color="#2f6feb" />
      )}
      {!loading && loadError && <Text style={styles.errorText}>{loadError}</Text>}
      {!loading && !loadError && <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
