// src/screens/ExpensesScreen.tsx
// "Expenses" tab: the add-expense form plus the running list, with a
// delete confirmation. Data comes from useExpenses(), which reloads
// whenever this screen regains focus.
// Connects to: src/hooks/useExpenses.ts, src/components/AddExpenseForm.tsx,
// src/components/ExpenseList.tsx, src/components/ScreenStatus.tsx
// Created: 2026-07-12

import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import AddExpenseForm from '../components/AddExpenseForm';
import ExpenseList from '../components/ExpenseList';
import ScreenStatus from '../components/ScreenStatus';
import { useExpenses } from '../hooks/useExpenses';
import { logger } from '../utils/logger';

const SCOPE = 'ExpensesScreen';

export default function ExpensesScreen() {
  const { expenses, loading, loadError, submitting, addNewExpense, removeExpense } = useExpenses();

  function handleDelete(id: string) {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeExpense(id);
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
      <AddExpenseForm onSubmit={addNewExpense} submitting={submitting} />
      <ScreenStatus loading={loading} error={loadError} />
      {!loading && !loadError && <ExpenseList expenses={expenses} onDelete={handleDelete} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
