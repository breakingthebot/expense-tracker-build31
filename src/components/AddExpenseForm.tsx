// src/components/AddExpenseForm.tsx
// Form for entering a new expense: amount, category, date, and an optional
// note. Validates input locally before calling onSubmit so the user sees
// errors immediately, without a round trip to storage.
// Connects to: src/config/categories.ts, src/utils/currency.ts, src/utils/date.ts, App.tsx
// Created: 2026-07-12

import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../config/categories';
import { NewExpenseInput } from '../models/expense';
import { parseDollarsToCents } from '../utils/currency';
import { todayIsoDate } from '../utils/date';

interface AddExpenseFormProps {
  onSubmit: (input: NewExpenseInput) => Promise<void>;
  submitting: boolean;
}

/** Renders the add-expense form and owns its own field state. */
export default function AddExpenseForm({ onSubmit, submitting }: AddExpenseFormProps) {
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [date] = useState(todayIsoDate());
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const amountCents = parseDollarsToCents(amountText);
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount, like 12.50.');
      return;
    }

    setError(null);
    try {
      await onSubmit({ amountCents, category, note, date });
      setAmountText('');
      setNote('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add expense.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add Expense</Text>

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

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="What was this for?"
        accessibilityLabel="Expense note"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
      >
        <Text style={styles.submitButtonText}>{submitting ? 'Adding…' : 'Add Expense'}</Text>
      </TouchableOpacity>
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
  error: {
    color: '#c0392b',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 16,
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
});
