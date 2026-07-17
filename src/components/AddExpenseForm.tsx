// src/components/AddExpenseForm.tsx
// Form for entering a new expense, or editing an existing one when
// `editingExpense` is passed in. Validates input locally before calling
// onSubmit so the user sees errors immediately, without a round trip to
// storage. The parent should remount this component (e.g. via a `key` tied
// to the expense id) when switching which expense is being edited, so field
// state re-seeds correctly.
// Connects to: src/config/categories.ts, src/utils/currency.ts, src/utils/date.ts, src/screens/AddScreen.tsx
// Created: 2026-07-12

import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../config/categories';
import { Expense, NewExpenseInput } from '../models/expense';
import { centsToInputString, parseDollarsToCents } from '../utils/currency';
import { formatDisplayDate, parseIsoDate, todayIsoDate, toIsoDate } from '../utils/date';

interface AddExpenseFormProps {
  onSubmit: (input: NewExpenseInput) => Promise<void>;
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
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(toIsoDate(selectedDate));
    }
  }

  async function handleSubmit() {
    const amountCents = parseDollarsToCents(amountText);
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount, like 12.50.');
      return;
    }

    setError(null);
    try {
      await onSubmit({ amountCents, category, note, date });
      if (!isEditing) {
        setAmountText('');
        setNote('');
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
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={parseIsoDate(date)}
          mode="date"
          display="compact"
          maximumDate={new Date()}
          onChange={handleDateChange}
          style={styles.iosDatePicker}
          accessibilityLabel="Expense date"
        />
      ) : (
        <>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowAndroidPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Expense date"
          >
            <Text style={styles.dateButtonText}>{formatDisplayDate(date)}</Text>
          </TouchableOpacity>
          {showAndroidPicker && (
            <DateTimePicker
              value={parseIsoDate(date)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </>
      )}

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="What was this for?"
        accessibilityLabel="Expense note"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? (isEditing ? 'Saving…' : 'Adding…') : isEditing ? 'Save Changes' : 'Add Expense'}
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
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  chipSelected: {
    backgroundColor: '#2f6feb',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  iosDatePicker: {
    alignSelf: 'flex-start',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0b0b0b',
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
});
