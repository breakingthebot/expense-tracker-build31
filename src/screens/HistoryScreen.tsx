// src/screens/HistoryScreen.tsx
// "History" tab screen: displays the running ledger of transactions using ExpenseList,
// and coordinates search/category filtering, delete operations, navigation to
// edit mode on the Add tab, CSV exporting, and bulk CSV uploads with live validation reporting.
// Connects to: src/components/ExpenseList.tsx, src/hooks/useExpenses.ts,
// src/services/expenseExport.ts, src/services/csvImport.ts, src/config/categories.ts,
// src/components/ThemeProvider.tsx
// Created: 2026-07-17

import { useMemo, useState, useRef, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import ExpenseList from '../components/ExpenseList';
import ScreenStatus from '../components/ScreenStatus';
import DatePicker from '../components/DatePicker';
import { ExpenseCategory } from '../config/categories';
import { useExpenses } from '../hooks/useExpenses';
import { Expense } from '../models/expense';
import { exportExpensesToCsv } from '../services/expenseExport';
import { validateCsvImport, ValidationResult } from '../services/csvImport';
import { forecastBalance } from '../services/forecaster';
import { formatCents } from '../utils/currency';
import { logger } from '../utils/logger';
import { useTheme } from '../components/ThemeProvider';
import { addDaysToIso, todayIsoDate, getThisWeekRange, getLast7DaysRange, getThisMonthRange } from '../utils/date';

const SCOPE = 'HistoryScreen';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const {
    expenses,
    recurringSchedules,
    loading,
    loadError,
    removeExpense,
    categories,
    importTransactions,
    seedDemoDataList,
    wipeAllStorageData,
    demoSeeded,
  } = useExpenses();
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPrefix, setExportPrefix] = useState('expenses_export');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // Onboarding welcome status
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@expense_tracker/dismissed_welcome').then((val) => {
      if (val === 'true') {
        setWelcomeDismissed(true);
      }
    });
  }, []);

  const handleDismissWelcome = async () => {
    await AsyncStorage.setItem('@expense_tracker/dismissed_welcome', 'true');
    setWelcomeDismissed(true);
  };

  // Date Range Filter States
  const [datePreset, setDatePreset] = useState<'all' | 'this_week' | 'last_7_days' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState(todayIsoDate());
  const [customEndDate, setCustomEndDate] = useState(todayIsoDate());

  // Future Forecast States
  const [forecastDate, setForecastDate] = useState(addDaysToIso(todayIsoDate(), 30));
  const [showForecastDetails, setShowForecastDetails] = useState(false);

  // Theme states
  const { theme, colors, changeTheme, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<any>(null);

  const forecastResult = useMemo(() => {
    return forecastBalance(expenses, recurringSchedules, forecastDate, todayIsoDate());
  }, [expenses, recurringSchedules, forecastDate]);

  const dateBounds = useMemo(() => {
    switch (datePreset) {
      case 'this_week':
        return getThisWeekRange(todayIsoDate());
      case 'last_7_days':
        return getLast7DaysRange(todayIsoDate());
      case 'this_month':
        return getThisMonthRange(todayIsoDate());
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return null;
    }
  }, [datePreset, customStartDate, customEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        expense.note.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query);
      
      let matchesDate = true;
      if (dateBounds) {
        matchesDate = expense.date >= dateBounds.start && expense.date <= dateBounds.end;
      }
      return matchesCategory && matchesSearch && matchesDate;
    });
  }, [expenses, selectedCategory, searchQuery, dateBounds]);

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== null || datePreset !== 'all';

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
    if (filteredExpenses.length === 0) {
      Alert.alert('No Data', 'There are no transactions in the current range to export.');
      return;
    }
    setShowExportModal(true);
  }

  async function executeExport() {
    setExporting(true);
    try {
      await exportExpensesToCsv(filteredExpenses, exportPrefix);
      setShowExportModal(false);
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

      {/* Onboarding Welcome / Demo Seeder Card */}
      {!loading && !loadError && expenses.length === 0 && recurringSchedules.length === 0 && !welcomeDismissed && (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>🚀</Text>
          <Text style={styles.welcomeTitle}>Welcome to your Expense Tracker!</Text>
          <Text style={styles.welcomeText}>
            Get started by adding a transaction, importing a CSV, or explore the features instantly using our pre-populated sample sandbox.
          </Text>
          <View style={styles.welcomeActions}>
            <TouchableOpacity
              style={styles.welcomeSeedButton}
              onPress={async () => {
                await seedDemoDataList();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.welcomeSeedButtonText}>🔮 Explore with Demo Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.welcomeStartButton}
              onPress={handleDismissWelcome}
              accessibilityRole="button"
            >
              <Text style={styles.welcomeStartButtonText}>Start Fresh</Text>
            </TouchableOpacity>
          </View>
        </View>
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

      {/* 🔮 Future Forecast Calculator Card */}
      {!loading && !loadError && (
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastTitle}>🔮 Cash Flow Forecaster</Text>
            <TouchableOpacity
              onPress={() => setShowForecastDetails(!showForecastDetails)}
              accessibilityRole="button"
              accessibilityLabel="Toggle forecast details"
            >
              <Text style={styles.forecastToggleText}>
                {showForecastDetails ? 'Hide Details' : 'Show Details'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.forecastControlRow}>
            <Text style={styles.forecastLabel}>Target Future Date:</Text>
            <DatePicker date={forecastDate} onDateChange={setForecastDate} />
          </View>

          <View style={styles.forecastResultRow}>
            <Text style={styles.forecastResultLabel}>Projected Balance:</Text>
            <Text
              style={[
                styles.forecastResultValue,
                forecastResult.projectedBalanceCents > 0 && styles.forecastResultPositive,
                forecastResult.projectedBalanceCents < 0 && styles.forecastResultNegative,
              ]}
            >
              {forecastResult.projectedBalanceCents >= 0 ? '' : '-'}{formatCents(Math.abs(forecastResult.projectedBalanceCents))}
            </Text>
          </View>

          {showForecastDetails && (
            <View style={styles.forecastDetailsContainer}>
              <Text style={styles.forecastSectionHeader}>Upcoming Forecasted Cash Flows</Text>
              {forecastResult.items.length === 0 ? (
                <Text style={styles.forecastEmptyText}>No bills or income scheduled before this date.</Text>
              ) : (
                <ScrollView style={styles.forecastScroll} nestedScrollEnabled={true}>
                  {forecastResult.items.map((item) => (
                    <View key={item.id} style={styles.forecastItemRow}>
                      <View style={styles.forecastItemLeft}>
                        <Text style={styles.forecastItemDate}>{item.date}</Text>
                        <Text style={styles.forecastItemNote} numberOfLines={1}>
                          {item.note} {item.isSimulated && <Text style={styles.forecastSimBadge}>(recurring)</Text>}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.forecastItemAmount,
                          item.type === 'income' ? styles.forecastItemAmountIncome : styles.forecastItemAmountExpense,
                        ]}
                      >
                        {item.type === 'income' ? '+' : '-'}{formatCents(item.amountCents)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
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

      {/* Date Range Filter Selector Strip */}
      <View style={styles.dateFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'this_week', 'last_7_days', 'this_month', 'custom'] as const).map((preset) => {
            const isSelected = datePreset === preset;
            let label = '';
            switch (preset) {
              case 'all': label = 'All Time'; break;
              case 'this_week': label = 'This Week'; break;
              case 'last_7_days': label = 'Last 7 Days'; break;
              case 'this_month': label = 'This Month'; break;
              case 'custom': label = 'Custom'; break;
            }
            return (
              <TouchableOpacity
                key={preset}
                onPress={() => setDatePreset(preset)}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Custom Date Picker Fields when active */}
      {datePreset === 'custom' && (
        <View style={styles.customDateRangeRow}>
          <View style={styles.customDateCol}>
            <Text style={styles.customDateLabel}>From:</Text>
            <DatePicker date={customStartDate} onDateChange={setCustomStartDate} />
          </View>
          <View style={styles.customDateCol}>
            <Text style={styles.customDateLabel}>To:</Text>
            <DatePicker date={customEndDate} onDateChange={setCustomEndDate} />
          </View>
        </View>
      )}

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

      {/* Export CSV Configuration modal */}
      <Modal
        visible={showExportModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Export Transactions</Text>
            <Text style={styles.modalSubtitle}>Customize the filename for your export file:</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>File Name Prefix</Text>
              <TextInput
                style={styles.modalInput}
                value={exportPrefix}
                onChangeText={setExportPrefix}
                placeholder="expenses_export"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <Text style={styles.modalHelpText}>
                Preview: {exportPrefix.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'expenses_export'}_{new Date().toISOString().slice(0, 10)}.csv
              </Text>
            </View>

            <View style={styles.exportModalActions}>
              <TouchableOpacity
                style={styles.exportModalConfirmBtn}
                onPress={executeExport}
                disabled={exporting}
                accessibilityRole="button"
              >
                <Text style={styles.exportConfirmBtnText}>
                  {exporting ? 'Generating...' : '📤 Export & Share'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportModalCancelBtn}
                onPress={() => setShowExportModal(false)}
                disabled={exporting}
                accessibilityRole="button"
              >
                <Text style={styles.exportCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              style={styles.modalWipeButton}
              onPress={() => {
                Alert.alert(
                  'Wipe Database',
                  'Are you sure you want to delete all transactions, recurring templates, and budget limits? This action is permanent.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Wipe Data',
                      style: 'destructive',
                      onPress: async () => {
                        await wipeAllStorageData();
                        await AsyncStorage.removeItem('@expense_tracker/dismissed_welcome');
                        setWelcomeDismissed(false);
                        setShowImportModal(false);
                      },
                    },
                  ]
                );
              }}
              accessibilityRole="button"
            >
              <Text style={styles.modalWipeButtonText}>Wipe Database (Reset App)</Text>
            </TouchableOpacity>

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
    forecastCard: {
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 6,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    forecastHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    forecastTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    forecastToggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    forecastControlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    forecastLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    forecastResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.borderSecondary,
      paddingTop: 10,
    },
    forecastResultLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    forecastResultValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    forecastResultPositive: {
      color: colors.success,
    },
    forecastResultNegative: {
      color: colors.error,
    },
    forecastDetailsContainer: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderSecondary,
    },
    forecastSectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    forecastScroll: {
      maxHeight: 150,
    },
    forecastEmptyText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
    },
    forecastItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSecondary,
    },
    forecastItemLeft: {
      flex: 1,
      marginRight: 10,
    },
    forecastItemDate: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
    },
    forecastItemNote: {
      fontSize: 12,
      color: colors.text,
      marginTop: 2,
    },
    forecastSimBadge: {
      fontSize: 10,
      fontStyle: 'italic',
      color: colors.textSecondary,
    },
    forecastItemAmount: {
      fontSize: 12,
      fontWeight: '600',
    },
    forecastItemAmountIncome: {
      color: colors.success,
    },
    forecastItemAmountExpense: {
      color: colors.text,
    },
    dateFilterContainer: {
      marginTop: 8,
      marginBottom: 4,
    },
    customDateRangeRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 6,
      marginBottom: 10,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      gap: 16,
    },
    customDateCol: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    customDateLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginRight: 8,
    },
    welcomeCard: {
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 6,
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    welcomeEmoji: {
      fontSize: 32,
      marginBottom: 10,
    },
    welcomeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    welcomeText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
    },
    welcomeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
    },
    welcomeSeedButton: {
      flex: 1.3,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    welcomeSeedButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    welcomeStartButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    welcomeStartButtonText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    modalWipeButton: {
      backgroundColor: isDark ? '#3d1616' : '#fde8e8',
      borderWidth: 1,
      borderColor: isDark ? '#802020' : '#f8b4b4',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    modalWipeButtonText: {
      color: isDark ? '#f8b4b4' : '#c81e1e',
      fontWeight: '600',
      fontSize: 14,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalField: {
      width: '100%',
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    modalInput: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      color: colors.text,
      fontSize: 14,
      backgroundColor: colors.background,
    },
    modalHelpText: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
    },
    exportModalActions: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 10,
    },
    exportModalConfirmBtn: {
      flex: 1.5,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    exportConfirmBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    exportModalCancelBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    exportCancelBtnText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
