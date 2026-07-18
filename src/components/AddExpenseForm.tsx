// src/components/AddExpenseForm.tsx
// Form for entering a new expense or income transaction, or editing an existing one when
// `editingExpense` is passed in. Includes a top segmented toggle between Expense and Income,
// and a "Repeat this transaction" checkbox for quick-add schedules. Validates input locally.
// Connects to: src/config/categories.ts, src/utils/currency.ts, src/utils/date.ts,
// src/models/recurring.ts, src/models/expense.ts, src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from './DatePicker';
import { ExpenseCategory } from '../config/categories';
import { Expense, TransactionType } from '../models/expense';
import { RecurringInterval } from '../models/recurring';
import { Category } from '../services/categoryStorage';
import { centsToInputString, parseDollarsToCents } from '../utils/currency';
import { todayIsoDate } from '../utils/date';
import { useTheme } from './ThemeProvider';

export interface AddFormSubmitData {
  amountCents: number;
  category: ExpenseCategory;
  note: string;
  date: string;
  isRecurring: boolean;
  interval?: RecurringInterval;
  type: TransactionType;
}

interface AddExpenseFormProps {
  onSubmit: (data: AddFormSubmitData) => Promise<void>;
  submitting: boolean;
  categories: Category[];
  defaultTxType: TransactionType;
  onTypeChange?: (type: TransactionType) => void;
  /** When set, the form edits this transaction instead of creating a new one. */
  editingExpense?: Expense;
  /** Shown only in edit mode; lets the user back out without saving. */
  onCancelEdit?: () => void;
}

/** Renders the add/edit transaction form and manages fields locally. */
export default function AddExpenseForm({
  onSubmit,
  submitting,
  categories,
  defaultTxType,
  onTypeChange,
  editingExpense,
  onCancelEdit,
}: AddExpenseFormProps) {
  const isEditing = editingExpense !== undefined;
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [type, setType] = useState<TransactionType>(
    editingExpense?.type ?? defaultTxType
  );
  const [amountText, setAmountText] = useState(
    editingExpense ? centsToInputString(editingExpense.amountCents) : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    editingExpense?.category ?? 'Other'
  );
  const [note, setNote] = useState(editingExpense?.note ?? '');
  const [date, setDate] = useState(editingExpense?.date ?? todayIsoDate());
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<RecurringInterval>('monthly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setType(defaultTxType);
    }
  }, [defaultTxType, isEditing]);

  async function handleSubmit() {
    const amountCents = parseDollarsToCents(amountText);
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount, like 12.50.');
      return;
    }

    if (isRecurring && !note.trim()) {
      setError('Note is required for recurring transaction schedules.');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        amountCents,
        category,
        note,
        date,
        isRecurring,
        interval: isRecurring ? interval : undefined,
        type,
      });
      if (!isEditing) {
        setAmountText('');
        setNote('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>

      {/* Segmented control for Expense vs Income */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, type === 'expense' && styles.segmentButtonActiveExpense]}
          onPress={() => {
            setType('expense');
            onTypeChange?.('expense');
          }}
          accessibilityRole="button"
          accessibilityLabel="Transaction Type: Expense"
        >
          <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, type === 'income' && styles.segmentButtonActiveIncome]}
          onPress={() => {
            setType('income');
            onTypeChange?.('income');
          }}
          accessibilityRole="button"
          accessibilityLabel="Transaction Type: Income"
        >
          <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Amount text input field */}
      <View style={styles.field}>
        <Text style={styles.label}>Amount ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          value={amountText}
          onChangeText={setAmountText}
          editable={!submitting}
          accessibilityLabel="Transaction amount field"
        />
      </View>

      {/* Note description input field */}
      <View style={styles.field}>
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder={type === 'income' ? 'e.g. Salary, Refund' : 'e.g. Coffee, Groceries'}
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          maxLength={200}
          editable={!submitting}
          accessibilityLabel="Transaction note field"
        />
      </View>

      {/* Category selector grid */}
      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.swatchContainer}>
          {categories.map((cat) => {
            const isChosen = category === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.swatchOption,
                  { borderColor: cat.color },
                  isChosen && { backgroundColor: cat.color },
                ]}
                onPress={() => setCategory(cat.name)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={`Select category ${cat.name}`}
              >
                <Text style={[styles.swatchText, isChosen && styles.swatchTextChosen]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Date Picker Component */}
      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <DatePicker date={date} onDateChange={setDate} />
      </View>

      {/* Quick Recurring schedule template checkbox (hidden in edit mode) */}
      {!isEditing && (
        <View style={styles.recurringSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsRecurring(!isRecurring)}
            disabled={submitting}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isRecurring }}
          >
            <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
              {isRecurring && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Repeat this transaction</Text>
          </TouchableOpacity>

          {isRecurring && (
            <View style={styles.intervalRow}>
              <Text style={styles.intervalLabel}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                {(['daily', 'weekly', 'monthly'] as const).map((mode) => {
                  const isActive = interval === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.frequencyButton, isActive && styles.frequencyButtonActive]}
                      onPress={() => setInterval(mode)}
                      disabled={submitting}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          isActive && styles.frequencyButtonTextActive,
                        ]}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Submit Actions */}
      <View style={styles.actions}>
        {isEditing && onCancelEdit && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelEdit}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Record'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentButtonActiveExpense: {
      backgroundColor: colors.primary,
    },
    segmentButtonActiveIncome: {
      backgroundColor: colors.success,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: '#fff',
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      marginBottom: 12,
      fontWeight: '500',
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      backgroundColor: colors.background,
      color: colors.text,
    },
    swatchContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2,
    },
    swatchOption: {
      borderWidth: 1.5,
      borderRadius: 18,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    swatchText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    swatchTextChosen: {
      color: '#fff',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    submitButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
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
      flex: 0.5,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    recurringSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
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
      borderColor: colors.textSecondary,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    checkboxChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    checkboxTick: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    checkboxLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    intervalRow: {
      marginTop: 12,
    },
    intervalLabel: {
      fontSize: 12,
      color: colors.textSecondary,
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
      borderColor: colors.borderSecondary,
      borderRadius: 6,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    frequencyButtonActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? '#142850' : '#ebf3ff',
    },
    frequencyButtonText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    frequencyButtonTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
