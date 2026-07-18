// src/screens/HistoryScreen.tsx
// "History" tab screen: displays the running ledger of transactions using ExpenseList,
// and coordinates search/category filtering, delete operations, navigation to
// edit mode on the Add tab, CSV exporting, and bulk CSV uploads with live validation reporting.
// Connects to: src/components/ExpenseList.tsx, src/hooks/useExpenses.ts,
// src/services/expenseExport.ts, src/services/csvImport.ts, src/config/categories.ts
// Created: 2026-07-17

import { useMemo, useState, useRef } from 'react';
import {
  Alert,
  Modal,
  Platform,
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
import { validateCsvImport, ValidationResult } from '../services/csvImport';
import { formatCents } from '../utils/currency';
import { logger } from '../utils/logger';

const SCOPE = 'HistoryScreen';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { expenses, loading, loadError, removeExpense, categories, importTransactions } = useExpenses();
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<any>(null);

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

  // Dynamic Dashboard Stats
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

  // CSV file select handler for browser web target
  function handleFileSelectWeb(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvRawText(text);
        try {
          const categoryNames = categories.map((c) => c.name);
          const result = validateCsvImport(text, expenses, categoryNames);
          setValidationResult(result);
        } catch (err) {
          logger.error(SCOPE, 'CSV validation error', { error: String(err) });
          setImportError('Failed to parse the CSV file. Check format and try again.');
        }
      }
    };
    reader.readAsText(file);
  }

  function triggerFilePicker() {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert('Web Feature', 'CSV file uploads are optimized for the web client.');
    }
  }

  async function handleExecuteImport() {
    if (!validationResult || validationResult.hasErrors || validationResult.validTransactions.length === 0) {
      return;
    }
    setImportError(null);
    try {
      const res = await importTransactions(csvRawText);
      setShowImportModal(false);
      setValidationResult(null);
      setCsvRawText('');
      Alert.alert('Import Successful', `Successfully imported ${res.validTransactions.length} transactions!`);
    } catch (err) {
      logger.error(SCOPE, 'Execute import failed', { error: String(err) });
      setImportError(err instanceof Error ? err.message : 'Bulk import failed. Check file cells.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden browser input element for web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv"
          onChange={handleFileSelectWeb}
        />
      )}

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
          onImportClick={() => {
            setImportError(null);
            setValidationResult(null);
            setCsvRawText('');
            setShowImportModal(true);
          }}
          isFiltered={isFiltered}
        />
      )}

      {/* Bulk CSV Upload overlay modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Import Transactions (CSV)</Text>

            {importError && <Text style={styles.modalError}>{importError}</Text>}

            {validationResult === null ? (
              // Step 1: Upload Box & Guidelines
              <View style={styles.uploadStepContainer}>
                <TouchableOpacity
                  style={styles.uploadDropzone}
                  onPress={triggerFilePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Tap to select CSV file"
                >
                  <Text style={styles.uploadIcon}>📥</Text>
                  <Text style={styles.uploadText}>
                    {Platform.OS === 'web' ? 'Tap to choose CSV file' : 'Import is supported on Web'}
                  </Text>
                  <Text style={styles.uploadSubtext}>Supports RFC 4180 standard formats</Text>
                </TouchableOpacity>

                <View style={styles.guidelinesBox}>
                  <Text style={styles.guidelinesTitle}>Expected Headers (Case-Insensitive):</Text>
                  <Text style={styles.guidelineRow}>
                    • <Text style={styles.bold}>Date</Text> (format: YYYY-MM-DD)
                  </Text>
                  <Text style={styles.guidelineRow}>
                    • <Text style={styles.bold}>Amount</Text> (numeric, e.g. 15.75)
                  </Text>
                  <Text style={styles.guidelineRow}>
                    • <Text style={styles.bold}>Category</Text> (auto-created if new)
                  </Text>
                  <Text style={styles.guidelineRow}>
                    • <Text style={styles.bold}>Note</Text> (optional, truncated if &gt; 200 chars)
                  </Text>
                  <Text style={styles.guidelineRow}>
                    • <Text style={styles.bold}>Type</Text> (optional: 'expense' or 'income')
                  </Text>
                </View>
              </View>
            ) : (
              // Step 2: Validation Results & Actions
              <View style={styles.validationStepContainer}>
                {/* Status Badges */}
                <View style={styles.statusBadgeRow}>
                  {validationResult.hasErrors ? (
                    <View style={[styles.badge, styles.badgeError]}>
                      <Text style={styles.badgeText}>❌ Errors found. Fix spreadsheet to import.</Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, styles.badgeSuccess]}>
                      <Text style={styles.badgeText}>
                        ✅ Ready: {validationResult.validTransactions.length} rows to import.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Problems Scroll area */}
                {validationResult.problems.length > 0 && (
                  <View style={styles.problemsContainer}>
                    <Text style={styles.problemsHeader}>Spreadsheet Problems Checked:</Text>
                    <ScrollView style={styles.problemsScroll}>
                      {validationResult.problems.map((prob, idx) => (
                        <View key={idx} style={styles.problemRow}>
                          <Text
                            style={[
                              styles.problemSeverity,
                              prob.severity === 'error' ? styles.colorError : styles.colorWarning,
                            ]}
                          >
                            [{prob.severity.toUpperCase()}] Row {prob.rowNumber}
                          </Text>
                          <Text style={styles.problemMessage}>{prob.message}</Text>
                          <Text style={styles.problemAction}>👉 {prob.actionNeeded}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Valid rows preview */}
                {!validationResult.hasErrors && validationResult.validTransactions.length > 0 && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.problemsHeader}>Valid Rows Preview:</Text>
                    <ScrollView style={styles.previewScroll}>
                      {validationResult.validTransactions.map((tx, idx) => (
                        <View key={idx} style={styles.previewRow}>
                          <Text style={styles.previewRowText}>
                            Row {tx.originalRow}: {tx.date} • {tx.category} • {tx.type === 'income' ? '+' : '-'}{formatCents(tx.amountCents)}
                          </Text>
                          {tx.note.length > 0 && <Text style={styles.previewRowNote}>{tx.note}</Text>}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Execute Actions */}
                <View style={styles.modalActionButtons}>
                  {!validationResult.hasErrors && validationResult.validTransactions.length > 0 ? (
                    <TouchableOpacity
                      style={styles.importConfirmButton}
                      onPress={handleExecuteImport}
                      accessibilityRole="button"
                    >
                      <Text style={styles.importConfirmButtonText}>Confirm Import</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reselectButton}
                      onPress={triggerFilePicker}
                      accessibilityRole="button"
                    >
                      <Text style={styles.reselectButtonText}>Choose Another File</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowImportModal(false)}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalError: {
    color: '#c0392b',
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  uploadStepContainer: {
    gap: 16,
  },
  uploadDropzone: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f6feb',
  },
  uploadSubtext: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  guidelinesBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  guidelinesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
  },
  guidelineRow: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  validationStepContainer: {
    gap: 14,
    flex: 1,
  },
  statusBadgeRow: {
    alignItems: 'stretch',
  },
  badge: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeError: {
    backgroundColor: '#fde8e8',
    borderWidth: 1,
    borderColor: '#f8b4b4',
  },
  badgeSuccess: {
    backgroundColor: '#edfdfd',
    borderWidth: 1,
    borderColor: '#c5f2f2',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  problemsContainer: {
    flex: 1,
    maxHeight: 180,
    backgroundColor: '#fffcf6',
    borderWidth: 1,
    borderColor: '#ffebc2',
    borderRadius: 8,
    padding: 10,
  },
  problemsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
  },
  problemsScroll: {
    flex: 1,
  },
  problemRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fff1d6',
  },
  problemSeverity: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorError: {
    color: '#c0392b',
  },
  colorWarning: {
    color: '#d68910',
  },
  problemMessage: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  problemAction: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
    fontStyle: 'italic',
  },
  previewContainer: {
    flex: 1,
    maxHeight: 180,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
  },
  previewScroll: {
    flex: 1,
  },
  previewRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  previewRowText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  previewRowNote: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  importConfirmButton: {
    flex: 1,
    backgroundColor: '#1baf7a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  importConfirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reselectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  reselectButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
