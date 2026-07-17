// src/screens/AddScreen.tsx
// "Add" tab screen: renders the AddExpenseForm inside a ScrollView.
// If navigation route params contain an editingExpense, it loads in
// "Edit Expense" mode. Completing or cancelling an edit navigates back
// to the "History" tab.
// Connects to: src/components/AddExpenseForm.tsx, src/hooks/useExpenses.ts
// Created: 2026-07-17

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import AddExpenseForm from '../components/AddExpenseForm';
import { useExpenses } from '../hooks/useExpenses';
import { NewExpenseInput } from '../models/expense';
import { TabParamList } from '../types/navigation';

export default function AddScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Add'>>();
  const { submitting, addNewExpense, editExpense } = useExpenses();

  const editingExpense = route.params?.editingExpense;

  async function handleFormSubmit(input: NewExpenseInput) {
    if (editingExpense) {
      await editExpense(editingExpense.id, input);
      navigation.setParams({ editingExpense: undefined });
      navigation.navigate('History');
    } else {
      await addNewExpense(input);
      navigation.navigate('History');
    }
  }

  function handleCancelEdit() {
    navigation.setParams({ editingExpense: undefined });
    navigation.navigate('History');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <AddExpenseForm
          key={editingExpense?.id ?? 'new'}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          editingExpense={editingExpense}
          onCancelEdit={handleCancelEdit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
