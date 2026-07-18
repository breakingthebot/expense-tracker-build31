// src/screens/ChartScreen.tsx
// "Chart" tab: spending aggregates by category. Supports switching between
// a static "Monthly Breakdown" bar chart and a rolling "3-Month Trends" card list.
// Handles month navigation globally so changing the month shifts both views.
// Connects to: src/hooks/useExpenses.ts, src/services/monthlySummary.ts,
// src/services/trendSummary.ts, src/components/MonthlyChart.tsx,
// src/components/TrendChart.tsx, src/components/ScreenStatus.tsx,
// src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MonthlyChart from '../components/MonthlyChart';
import WeeklyChart from '../components/WeeklyChart';
import TrendChart from '../components/TrendChart';
import ForecastView from '../components/ForecastView';
import ScreenStatus from '../components/ScreenStatus';
import { useExpenses } from '../hooks/useExpenses';
import { currentMonthKey, summarizeMonth, summarizeWeeks } from '../services/monthlySummary';
import { getTrendSummary } from '../services/trendSummary';
import { formatMonthLabel, shiftMonthKey } from '../utils/date';
import { useTheme } from '../components/ThemeProvider';

export default function ChartScreen() {
  const {
    expenses,
    recurringSchedules,
    categories,
    budgetGoals,
    defaultTxType,
    setDefaultTxType,
    startingBalance,
    startingBalanceDate,
    updateStartingBalance,
    updateBudgetGoal,
    loading,
    loadError,
  } = useExpenses();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'trend' | 'forecast'>('monthly');

  // Budget Edit Modal States
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [activeBudgetCategory, setActiveBudgetCategory] = useState<string | null>(null);
  const [budgetInputValue, setBudgetInputValue] = useState('');

  function handleOpenBudgetEdit(category: string) {
    setActiveBudgetCategory(category);
    const existingLimitCents = budgetGoals[category] ?? 0;
    if (existingLimitCents > 0) {
      setBudgetInputValue((existingLimitCents / 100).toString());
    } else {
      setBudgetInputValue('');
    }
    setBudgetModalVisible(true);
  }

  async function handleSaveBudgetGoal() {
    if (!activeBudgetCategory) return;
    const dollars = parseFloat(budgetInputValue.trim());
    const limitCents = isNaN(dollars) || dollars <= 0 ? 0 : Math.round(dollars * 100);

    try {
      await updateBudgetGoal(activeBudgetCategory, limitCents);
      setBudgetModalVisible(false);
      setActiveBudgetCategory(null);
      setBudgetInputValue('');
    } catch (err) {
      // Handled in storage logic
    }
  }

  // Theme support
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const summary = useMemo(() => {
    return summarizeMonth(expenses, monthKey, defaultTxType);
  }, [expenses, monthKey, defaultTxType]);

  const weeklySummary = useMemo(() => {
    return summarizeWeeks(expenses, monthKey, defaultTxType);
  }, [expenses, monthKey, defaultTxType]);

  const trendSummary = useMemo(() => {
    return getTrendSummary(expenses, monthKey, defaultTxType);
  }, [expenses, monthKey, defaultTxType]);

  // Construct a dynamic lookup map of category names to hex color codes
  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat.name] = cat.color;
    });
    return map;
  }, [categories]);

  const canGoToNextMonth = monthKey !== currentMonthKey();

  function goToPreviousMonth() {
    setMonthKey((prev) => shiftMonthKey(prev, -1));
  }

  function goToNextMonth() {
    setMonthKey((prev) => (prev === currentMonthKey() ? prev : shiftMonthKey(prev, 1)));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenStatus loading={loading} error={loadError} />
      {!loading && !loadError && (
        <>
          {/* Shared Month Navigation Header */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={styles.monthNavButton}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Text style={styles.monthNavArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{formatMonthLabel(monthKey)}</Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={!canGoToNextMonth}
              style={styles.monthNavButton}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              accessibilityState={{ disabled: !canGoToNextMonth }}
            >
              <Text style={[styles.monthNavArrow, !canGoToNextMonth && styles.monthNavArrowDisabled]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expense/Income Mode Segment Toggles (Default Tabs synchronizer) */}
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                defaultTxType === 'expense' && styles.modeToggleButtonActiveExpense,
              ]}
              onPress={() => setDefaultTxType('expense')}
              accessibilityRole="button"
              accessibilityLabel="Switch charts to Expense data"
            >
              <Text style={[styles.modeToggleText, defaultTxType === 'expense' && styles.modeToggleTextActive]}>
                Expenses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                defaultTxType === 'income' && styles.modeToggleButtonActiveIncome,
              ]}
              onPress={() => setDefaultTxType('income')}
              accessibilityRole="button"
              accessibilityLabel="Switch charts to Income data"
            >
              <Text style={[styles.modeToggleText, defaultTxType === 'income' && styles.modeToggleTextActive]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle Row */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
              onPress={() => setViewMode('monthly')}
              accessibilityRole="button"
              accessibilityLabel="View monthly breakdown chart"
            >
              <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
                Breakdown
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'weekly' && styles.toggleButtonActive]}
              onPress={() => setViewMode('weekly')}
              accessibilityRole="button"
              accessibilityLabel="View weekly summary breakdown"
            >
              <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'trend' && styles.toggleButtonActive]}
              onPress={() => setViewMode('trend')}
              accessibilityRole="button"
              accessibilityLabel="View 3-month trends list"
            >
              <Text style={[styles.toggleText, viewMode === 'trend' && styles.toggleTextActive]}>
                Trends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'forecast' && styles.toggleButtonActive]}
              onPress={() => setViewMode('forecast')}
              accessibilityRole="button"
              accessibilityLabel="View forward-looking cash flow forecast"
            >
              <Text style={[styles.toggleText, viewMode === 'forecast' && styles.toggleTextActive]}>
                Forecast
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Content Rendering */}
          {viewMode === 'monthly' && (
            <MonthlyChart
              summary={summary}
              categoryColors={categoryColors}
              budgetGoals={budgetGoals}
              chartType={defaultTxType}
              onBudgetPress={handleOpenBudgetEdit}
            />
          )}
          {viewMode === 'weekly' && (
            <WeeklyChart
              summary={weeklySummary}
              chartType={defaultTxType}
            />
          )}
          {viewMode === 'trend' && (
            <TrendChart
              trends={trendSummary}
              latestMonthLabel={formatMonthLabel(monthKey)}
              categoryColors={categoryColors}
            />
          )}
          {viewMode === 'forecast' && (
            <ForecastView
              expenses={expenses}
              recurringSchedules={recurringSchedules}
              startingBalance={startingBalance}
              startingBalanceDate={startingBalanceDate}
              onUpdateStartingBalance={updateStartingBalance}
            />
          )}
        </>
      )}

      {/* Budget Goal Edit Modal */}
      <Modal
        visible={budgetModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Monthly Budget Goal</Text>
            <Text style={styles.modalSubtitle}>
              Set a monthly spending limit for <Text style={styles.modalCategoryHighlight}>{activeBudgetCategory}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={budgetInputValue}
                onChangeText={setBudgetInputValue}
                autoFocus={true}
                accessibilityLabel="Budget amount in dollars"
              />
            </View>
            
            <Text style={styles.inputHint}>
              Enter the limit in dollars. Enter 0 or leave blank to remove the budget goal.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setBudgetModalVisible(false);
                  setActiveBudgetCategory(null);
                  setBudgetInputValue('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing budget"
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveBudgetGoal}
                accessibilityRole="button"
                accessibilityLabel="Save budget limit"
              >
                <Text style={styles.modalButtonTextSave}>Save Limit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 12,
    },
    monthNavButton: {
      minWidth: 44,
      minHeight: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNavArrow: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },
    monthNavArrowDisabled: {
      color: colors.textMuted,
    },
    monthLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      minWidth: 120,
      textAlign: 'center',
    },
    modeToggleRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 14,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      padding: 3,
    },
    modeToggleButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 6,
    },
    modeToggleButtonActiveExpense: {
      backgroundColor: colors.primary,
    },
    modeToggleButtonActiveIncome: {
      backgroundColor: colors.success,
    },
    modeToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeToggleTextActive: {
      color: '#fff',
    },
    toggleRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      padding: 3,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    toggleButtonActive: {
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    toggleTextActive: {
      fontWeight: '600',
      color: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.borderSecondary,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalCategoryHighlight: {
      fontWeight: '600',
      color: colors.primary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceSecondary,
      marginBottom: 8,
      height: 48,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      marginRight: 8,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      height: '100%',
      padding: 0,
    },
    inputHint: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 16,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonCancel: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
    },
    modalButtonSave: {
      backgroundColor: colors.primary,
    },
    modalButtonTextCancel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalButtonTextSave: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
  });
