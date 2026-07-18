// src/screens/AddScreen.tsx
// "Add" tab screen: renders the AddExpenseForm inside a ScrollView,
// and lists active recurring expense schedules at the bottom of the page,
// allowing users to manage or cancel subscriptions/schedules.
// Connects to: src/components/AddExpenseForm.tsx, src/hooks/useExpenses.ts, src/utils/currency.ts
// Created: 2026-07-17

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddExpenseForm, { AddFormSubmitData } from '../components/AddExpenseForm';
import { useExpenses } from '../hooks/useExpenses';
import { TabParamList } from '../types/navigation';
import { formatCents } from '../utils/currency';

export default function AddScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Add'>>();
  const {
    submitting,
    addNewExpense,
    editExpense,
    addNewRecurringExpense,
    recurringSchedules,
    removeRecurringExpense,
  } = useExpenses();

  const editingExpense = route.params?.editingExpense;

  async function handleFormSubmit(input: AddFormSubmitData) {
    if (editingExpense) {
      await editExpense(editingExpense.id, {
        amountCents: input.amountCents,
        category: input.category,
        note: input.note,
        date: input.date,
      });
      navigation.setParams({ editingExpense: undefined });
      navigation.navigate('History');
    } else if (input.isRecurring && input.interval) {
      await addNewRecurringExpense({
        amountCents: input.amountCents,
        category: input.category,
        note: input.note,
        interval: input.interval,
        startDate: input.date,
      });
      navigation.navigate('History');
    } else {
      await addNewExpense({
        amountCents: input.amountCents,
        category: input.category,
        note: input.note,
        date: input.date,
      });
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

        {/* Active recurring bill templates */}
        {!editingExpense && recurringSchedules.length > 0 && (
          <View style={styles.recurringSection}>
            <Text style={styles.sectionHeader}>Active Recurring Bills</Text>
            {recurringSchedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleNote}>{schedule.note}</Text>
                  <Text style={styles.scheduleSubtext}>
                    {schedule.category} • {schedule.interval.charAt(0).toUpperCase() + schedule.interval.slice(1)} • Starts {schedule.startDate}
                  </Text>
                </View>
                <View style={styles.scheduleRight}>
                  <Text style={styles.scheduleAmount}>{formatCents(schedule.amountCents)}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeRecurringExpense(schedule.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete recurring schedule for ${schedule.note}`}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
  recurringSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scheduleSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  scheduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: 'bold',
  },
});
