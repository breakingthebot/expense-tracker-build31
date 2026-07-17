// src/screens/HistoryScreen.tsx
// "History" tab screen: displays the running ledger of expenses using ExpenseList,
// and coordinates search/category filtering, delete operations, navigation to
// edit mode on the Add tab, and CSV exporting.
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
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../config/categories';
import { useExpenses } from '../hooks/useExpenses';
import { Expense } from '../models/expense';
import { exportExpensesToCsv } from '../services/expenseExport';
import { logger } from '../utils/logger';

const SCOPE = 'HistoryScreen';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { expenses, loading, loadError, removeExpense } = useExpenses();
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

  function handleEdit(item: Expense) {
    navigation.navigate('Add', { editingExpense: item });
  }

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
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes or categories..."
            placeholderTextColor="#888"
            accessibilityLabel="Search expenses"
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
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {cat}
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
