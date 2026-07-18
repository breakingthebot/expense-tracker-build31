// src/components/ExpenseList.tsx
// Displays the saved transactions, most recent first. Tapping a row edits it;
// tapping "Delete" removes it. Shows a dedicated empty state when there are
// no records yet. Highlights income items with green color and positive prefixes.
// Connects to: src/models/expense.ts, src/utils/currency.ts, src/utils/date.ts,
// src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Expense } from '../models/expense';
import { formatCents } from '../utils/currency';
import { formatDisplayDate } from '../utils/date';
import { useTheme } from './ThemeProvider';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  exporting: boolean;
  onImportClick: () => void;
  onCategorySwap: (expense: Expense) => void;
  isFiltered?: boolean;
}

/** Renders the list of transactions, or an empty-state message when there are none. */
export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  onExport,
  exporting,
  onImportClick,
  onCategorySwap,
  isFiltered = false,
}: ExpenseListProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (expenses.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {isFiltered ? 'No matching transactions found.' : 'No transactions yet. Add your first one.'}
        </Text>
        {!isFiltered && (
          <TouchableOpacity style={styles.emptyImportButton} onPress={onImportClick} accessibilityRole="button">
            <Text style={styles.emptyImportButtonText}>＋ Import transactions from CSV</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.headerTitle}>Recent Transactions</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={onImportClick}
              accessibilityRole="button"
              accessibilityLabel="Import transactions from CSV"
            >
              <Text style={styles.importButtonText}>Import CSV</Text>
            </TouchableOpacity>
            <Text style={styles.actionPipe}>|</Text>
            <TouchableOpacity
              onPress={onExport}
              disabled={exporting}
              accessibilityRole="button"
              accessibilityLabel="Export transactions as CSV"
            >
              <Text style={[styles.exportButtonText, exporting && styles.exportButtonDisabledText]}>
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const isIncome = item.type === 'income';

        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => onEdit(item)}
            accessibilityRole="button"
            accessibilityLabel={`Edit transaction: ${item.category}, ${formatCents(item.amountCents)}`}
          >
            <View style={styles.rowText}>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryBadge}
                  onPress={() => onCategorySwap(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Change category: ${item.category}`}
                >
                  <Text style={styles.categoryText}>{item.category} ▾</Text>
                </TouchableOpacity>
              </View>
              {item.note.length > 0 && <Text style={styles.note}>{item.note}</Text>}
              <Text style={styles.date}>{formatDisplayDate(item.date)}</Text>
            </View>
            <View style={styles.rowActions}>
              <Text style={[styles.amount, isIncome && styles.amountIncome]}>
                {isIncome ? '+' : '-'}{formatCents(item.amountCents)}
              </Text>
              <TouchableOpacity
                onPress={() => onDelete(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Delete transaction: ${item.category}, ${formatCents(item.amountCents)}`}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    listContent: {
      padding: 16,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionPipe: {
      fontSize: 12,
      color: colors.borderSecondary,
    },
    importButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.success,
    },
    exportButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    exportButtonDisabledText: {
      color: colors.textMuted,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: {
      flex: 1,
      paddingRight: 12,
    },
    categoryContainer: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    categoryBadge: {
      backgroundColor: colors.surfaceSecondary,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    note: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    date: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    rowActions: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    amountIncome: {
      color: colors.success,
    },
    deleteText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 6,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyImportButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.success,
      backgroundColor: colors.background,
    },
    emptyImportButtonText: {
      color: colors.success,
      fontWeight: '600',
      fontSize: 13,
    },
  });
