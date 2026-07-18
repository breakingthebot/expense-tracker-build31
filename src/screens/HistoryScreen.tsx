// src/screens/HistoryScreen.tsx
// "History" tab screen: displays the running ledger of transactions using ExpenseList,
// and coordinates search/category filtering, delete operations, navigation to
// edit mode on the Add tab, CSV exporting, and bulk CSV uploads with live validation reporting.
// Connects to: src/components/ExpenseList.tsx, src/hooks/useExpenses.ts,
// src/services/expenseExport.ts, src/services/csvImport.ts, src/config/categories.ts,
// src/components/ThemeProvider.tsx
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
import { useTheme } from '../components/ThemeProvider';

const SCOPE = 'HistoryScreen';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { expenses, loading, loadError, removeExpense, categories, importTransactions } = useExpenses();
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // Theme states
  const { theme, colors, changeTheme, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

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

      {/* Top Header Selector Area */}
      <View style={styles.headerTopBar}>
        <Text style={styles.headerTopTitle}>Ledger Dashboard</Text>
        <View style={styles.themeSelector}>
          <TouchableOpacity
            style={[styles.themeOption, theme === 'light' && styles.themeOptionActive]}
            onPress={() => changeTheme('light')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Light Theme"
          >
            <Text style={styles.themeEmoji}>☀️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeOption, theme === 'dark' && styles.themeOptionActive]}
            onPress={() => changeTheme('dark')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Dark Theme"
          >
            <Text style={styles.themeEmoji}>🌙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeOption, theme === 'oled' && styles.themeOptionActive]}
            onPress={() => changeTheme('oled')}
            accessibilityRole="button"
            accessibilityLabel="Switch to OLED Black Theme"
          >
            <Text style={styles.themeEmoji}>🕶️</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            placeholderTextColor={colors.textMuted}
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

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTopTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    themeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 16,
      padding: 3,
      gap: 2,
    },
    themeOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeOptionActive: {
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    themeEmoji: {
      fontSize: 14,
    },
    dashboardCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      backgroundColor: colors.border,
    },
    dbLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: 4,
    },
    dbValueIncome: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.success,
    },
    dbValueExpense: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    dbValueNet: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    dbValueNetPositive: {
      color: colors.success,
    },
    dbValueNetNegative: {
      color: colors.error,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
    },
    clearButton: {
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearButtonText: {
      fontSize: 20,
      color: colors.textSecondary,
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
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    filterChipTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    // Modal Styling
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 460,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalError: {
      color: colors.error,
      fontSize: 12,
      marginBottom: 14,
      textAlign: 'center',
    },
    uploadStepContainer: {
      gap: 16,
    },
    uploadDropzone: {
      borderWidth: 2,
      borderColor: colors.borderSecondary,
      borderStyle: 'dashed',
      borderRadius: 12,
      paddingVertical: 32,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    uploadIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    uploadText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    uploadSubtext: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },
    guidelinesBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      padding: 12,
    },
    guidelinesTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    guidelineRow: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    bold: {
      fontWeight: '700',
      color: colors.text,
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
      backgroundColor: isDark ? '#3d1616' : '#fde8e8',
      borderWidth: 1,
      borderColor: isDark ? '#802020' : '#f8b4b4',
    },
    badgeSuccess: {
      backgroundColor: isDark ? '#143224' : '#edfdfd',
      borderWidth: 1,
      borderColor: isDark ? '#206040' : '#c5f2f2',
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.text,
    },
    problemsContainer: {
      flex: 1,
      maxHeight: 180,
      backgroundColor: isDark ? '#241a0c' : '#fffcf6',
      borderWidth: 1,
      borderColor: isDark ? '#503810' : '#ffebc2',
      borderRadius: 8,
      padding: 10,
    },
    problemsHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    problemsScroll: {
      flex: 1,
    },
    problemRow: {
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3a2b16' : '#fff1d6',
    },
    problemSeverity: {
      fontSize: 11,
      fontWeight: '700',
    },
    colorError: {
      color: colors.error,
    },
    colorWarning: {
      color: colors.warning,
    },
    problemMessage: {
      fontSize: 12,
      color: colors.text,
      marginTop: 2,
    },
    problemAction: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      fontStyle: 'italic',
    },
    previewContainer: {
      flex: 1,
      maxHeight: 180,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
    },
    previewScroll: {
      flex: 1,
    },
    previewRow: {
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    previewRowText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    previewRowNote: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    modalActionButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    importConfirmButton: {
      flex: 1,
      backgroundColor: colors.success,
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
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    reselectButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    modalCloseButton: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    modalCloseButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 14,
    },
  });
