// src/screens/ExpensesScreen.tsx
// "Expenses" tab: the add/edit-expense form plus the running list, with a
// delete confirmation. Tapping a row switches the form into edit mode for
// that expense; the form is remounted (via `key`) whenever the edit target
// changes so its field state re-seeds correctly. Data comes from
// useExpenses(), which reloads whenever this screen regains focus.
// Connects to: src/hooks/useExpenses.ts, src/components/AddExpenseForm.tsx,
// src/components/ExpenseList.tsx, src/components/ScreenStatus.tsx
// Created: 2026-07-12

import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import AddExpenseForm from '../components/AddExpenseForm';
import ExpenseList from '../components/ExpenseList';
import ScreenStatus from '../components/ScreenStatus';
import { useExpenses } from '../hooks/useExpenses';
import { Expense, NewExpenseInput } from '../models/expense';
import { logger } from '../utils/logger';

const SCOPE = 'ExpensesScreen';

export default function ExpensesScreen() {
  const { expenses, loading, loadError, submitting, addNewExpense, editExpense, removeExpense } =
    useExpenses();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  async function handleFormSubmit(input: NewExpenseInput) {
    if (editingExpense) {
      await editExpense(editingExpense.id, input);
      setEditingExpense(null);
    } else {
      await addNewExpense(input);
    }
  }

  function handleDelete(id: string) {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeExpense(id);
            if (editingExpense?.id === id) {
              setEditingExpense(null);
            }
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
      <AddExpenseForm
        key={editingExpense?.id ?? 'new'}
        onSubmit={handleFormSubmit}
        submitting={submitting}
        editingExpense={editingExpense ?? undefined}
        onCancelEdit={() => setEditingExpense(null)}
      />
      <ScreenStatus loading={loading} error={loadError} />
      {!loading && !loadError && (
        <ExpenseList expenses={expenses} onEdit={setEditingExpense} onDelete={handleDelete} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
