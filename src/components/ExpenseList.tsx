// src/components/ExpenseList.tsx
// Displays the saved expenses, most recent first. Tapping a row edits it;
// tapping "Delete" removes it. Shows a dedicated empty state when there are
// no expenses yet.
// Connects to: src/models/expense.ts, src/utils/currency.ts, src/utils/date.ts, src/screens/HistoryScreen.tsx
// Created: 2026-07-12

import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Expense } from '../models/expense';
import { formatCents } from '../utils/currency';
import { formatDisplayDate } from '../utils/date';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  exporting: boolean;
  isFiltered?: boolean;
}

/** Renders the list of expenses, or an empty-state message when there are none. */
export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  onExport,
  exporting,
  isFiltered = false,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {isFiltered ? 'No matching expenses found.' : 'No expenses yet. Add your first one above.'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={(expense) => expense.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Recent Expenses</Text>
          <TouchableOpacity
            onPress={onExport}
            disabled={exporting}
            accessibilityRole="button"
            accessibilityLabel="Export expenses as CSV"
          >
            <Text style={[styles.exportButtonText, exporting && styles.exportButtonDisabledText]}>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => onEdit(item)}
          accessibilityRole="button"
          accessibilityLabel={`Edit expense: ${item.category}, ${formatCents(item.amountCents)}`}
        >
          <View style={styles.rowText}>
            <Text style={styles.category}>{item.category}</Text>
            {item.note.length > 0 && <Text style={styles.note}>{item.note}</Text>}
            <Text style={styles.date}>{formatDisplayDate(item.date)}</Text>
          </View>
          <View style={styles.rowActions}>
            <Text style={styles.amount}>{formatCents(item.amountCents)}</Text>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Delete expense: ${item.category}, ${formatCents(item.amountCents)}`}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2980b9',
  },
  exportButtonDisabledText: {
    color: '#95a5a6',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  rowActions: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 12,
    color: '#c0392b',
    marginTop: 6,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
