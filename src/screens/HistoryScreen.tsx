// src/screens/HistoryScreen.tsx
// "History" tab screen: displays the running ledger of transactions using ExpenseList,
// and coordinates search/category filtering, delete operations, navigation to
// edit mode on the Add tab, and CSV exporting. Shows a net balance dashboard card
// at the top.
// Connects to: src/components/ExpenseList.tsx, src/hooks/useExpenses.ts, src/services/expenseExport.ts, src/config/categories.ts
// Created: 2026-07-17

import { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ExpenseList from '../components/ExpenseList';
import ScreenStatus from '../components/ScreenStatus';
import { ExpenseCategory } from '../config/categories';
import { useExpenses } from '../hooks/useExpenses';
import { Expense } from '../models/expense';
import { exportExpensesToCsv } from '../services/expenseExport';
import { formatCents } from '../utils/currency';
import { logger } from '../utils/logger';

const SCOPE = 'HistoryScreen';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { expenses, loading, loadError, removeExpense, categories } = useExpenses();
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        expense.note.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== null;

  // Calculate dynamic dashboard stats based on the currently filtered list
  const { totalIncomeCents, totalExpenseCents, netBalanceCents } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredExpenses.forEach((item) => {
      if (item.type === 'income') {
        income += item.amountCents;
      } else {
        expense += item.amountCents;
      }
    });
    return {
      totalIncomeCents: income,
      totalExpenseCents: expense,
      netBalanceCents: income - expense,
    };
  }, [filteredExpenses]);

  function handleEdit(item: Expense) {
    navigation.navigate('Add', { editingExpense: item });
  }

  function handleDelete(id: string) {
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeExpense(id);
          } catch (error) {
            logger.error(SCOPE, 'Failed to delete transaction', { error: String(error) });
            Alert.alert('Could not delete transaction', 'Please try again.');
          }
        },
      },
    ]);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportExpensesToCsv(filteredExpenses);
    } catch (error) {
      logger.error(SCOPE, 'Export execution failed', { error: String(error) });
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Ledger Dashboard Summary Card */}
      {!loading && !loadError && (
        <View style={styles.dashboardCard}>
          <View style={styles.dbCol}>
            <Text style={styles.dbLabel}>Income</Text>
            <Text style={styles.dbValueIncome}>+{formatCents(totalIncomeCents)}</Text>
          </View>
          <View style={styles.dbDivider} />
          <View style={styles.dbCol}>
            <Text style={styles.dbLabel}>Spent</Text>
            <Text style={styles.dbValueExpense}>-{formatCents(totalExpenseCents)}</Text>
          </View>
          <View style={styles.dbDivider} />
          <View style={styles.dbCol}>
            <Text style={styles.dbLabel}>{isFiltered ? 'Net Total' : 'Net Balance'}</Text>
            <Text
              style={[
                styles.dbValueNet,
                netBalanceCents > 0 && styles.dbValueNetPositive,
                netBalanceCents < 0 && styles.dbValueNetNegative,
              ]}
            >
              {netBalanceCents >= 0 ? '' : '-'}{formatCents(Math.abs(netBalanceCents))}
            </Text>
          </View>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes or categories..."
            placeholderTextColor="#888"
            accessibilityLabel="Search transactions"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search query"
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Horizontal Scrolling Strip */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={[styles.filterChip, selectedCategory === null && styles.filterChipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === null }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === null && styles.filterChipTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.name)}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScreenStatus loading={loading} error={loadError} />
      {!loading && !loadError && (
        <ExpenseList
          expenses={filteredExpenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
          exporting={exporting}
          isFiltered={isFiltered}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dashboardCard: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dbCol: {
    flex: 1,
    alignItems: 'center',
  },
  dbDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e5e5',
  },
  dbLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  dbValueIncome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1baf7a',
  },
  dbValueExpense: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  dbValueNet: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  dbValueNetPositive: {
    color: '#1baf7a',
  },
  dbValueNetNegative: {
    color: '#c0392b',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#888',
    fontWeight: 'bold',
  },
  filterWrapper: {
    paddingBottom: 4,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  filterChipSelected: {
    backgroundColor: '#2f6feb',
    borderColor: '#2f6feb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
