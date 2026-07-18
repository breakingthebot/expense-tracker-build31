// src/components/AddExpenseForm.tsx
// Form for entering a new expense, or editing an existing one when
// `editingExpense` is passed in. Includes a "Repeat this expense" checkbox
// for quick-add schedules (disabled in edit mode). Validates input locally.
// Connects to: src/config/categories.ts, src/utils/currency.ts, src/utils/date.ts,
// src/models/recurring.ts, src/screens/AddScreen.tsx
// Created: 2026-07-12

import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from './DatePicker';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../config/categories';
import { Expense } from '../models/expense';
import { RecurringInterval } from '../models/recurring';
import { centsToInputString, parseDollarsToCents } from '../utils/currency';
import { todayIsoDate } from '../utils/date';

export interface AddFormSubmitData {
  amountCents: number;
  category: ExpenseCategory;
  note: string;
  date: string;
  isRecurring: boolean;
  interval?: RecurringInterval;
}

interface AddExpenseFormProps {
  onSubmit: (data: AddFormSubmitData) => Promise<void>;
  submitting: boolean;
  /** When set, the form edits this expense instead of creating a new one. */
  editingExpense?: Expense;
  /** Shown only in edit mode; lets the user back out without saving. */
  onCancelEdit?: () => void;
}

/** Renders the add/edit-expense form and owns its own field state. */
export default function AddExpenseForm({
  onSubmit,
  submitting,
  editingExpense,
  onCancelEdit,
}: AddExpenseFormProps) {
  const isEditing = editingExpense !== undefined;
  const [amountText, setAmountText] = useState(
    editingExpense ? centsToInputString(editingExpense.amountCents) : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    editingExpense?.category ?? EXPENSE_CATEGORIES[0]
  );
  const [note, setNote] = useState(editingExpense?.note ?? '');
  const [date, setDate] = useState(editingExpense?.date ?? todayIsoDate());
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<RecurringInterval>('monthly');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const amountCents = parseDollarsToCents(amountText);
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount, like 12.50.');
      return;
    }

    if (isRecurring && !note.trim()) {
      setError('Note is required for recurring bills.');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        amountCents,
        category,
        note,
        date,
        isRecurring: !isEditing && isRecurring,
        interval: !isEditing && isRecurring ? interval : undefined,
      });

      if (!isEditing) {
        setAmountText('');
        setNote('');
        setIsRecurring(false);
      }
    } catch (submitError) {
      const fallback = isEditing ? 'Could not save changes.' : 'Could not add expense.';
      setError(submitError instanceof Error ? submitError.message : fallback);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0.00"
        keyboardType="decimal-pad"
        accessibilityLabel="Expense amount"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {EXPENSE_CATEGORIES.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setCategory(option)}
            style={[styles.chip, option === category && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: option === category }}
          >
            <Text style={[styles.chipText, option === category && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <DatePicker date={date} onDateChange={setDate} />

      <Text style={styles.label}>Note {isRecurring ? '' : '(optional)'}</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder={isRecurring ? "e.g. Netflix Subscription" : "What was this for?"}
        accessibilityLabel="Expense note"
      />

      {/* Recurring options (hidden in edit mode) */}
      {!isEditing && (
        <View style={styles.recurringSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsRecurring(!isRecurring)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isRecurring }}
          >
            <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
              {isRecurring && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Repeat this expense</Text>
          </TouchableOpacity>

          {isRecurring && (
            <View style={styles.intervalRow}>
              <Text style={styles.intervalLabel}>Frequency:</Text>
              <View style={styles.frequencyButtons}>
                {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringInterval[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.frequencyButton, interval === f && styles.frequencyButtonActive]}
                    onPress={() => setInterval(f)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: interval === f }}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        interval === f && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {submitting
              ? isEditing
                ? 'Saving…'
                : 'Adding…'
              : isEditing
              ? 'Save Changes'
              : isRecurring
              ? 'Schedule Bill'
              : 'Add Expense'}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelEdit}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0b0b0b',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipSelected: {
    borderColor: '#2f6feb',
    backgroundColor: '#2f6feb',
  },
  chipText: {
    fontSize: 13,
    color: '#52514e',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#c0392b',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2f6feb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  recurringSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#2f6feb',
    backgroundColor: '#2f6feb',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  intervalRow: {
    marginTop: 12,
  },
  intervalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  frequencyButtonActive: {
    borderColor: '#2f6feb',
    backgroundColor: '#ebf3ff',
  },
  frequencyButtonText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
  frequencyButtonTextActive: {
    color: '#2f6feb',
    fontWeight: '600',
  },
});
