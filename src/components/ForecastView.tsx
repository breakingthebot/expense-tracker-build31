// src/components/ForecastView.tsx
// Renders the forward-looking balance projections, starting balance settings, and projected transaction timeline.
// Connects to: src/services/forecaster.ts, src/components/DatePicker.tsx,
// src/utils/currency.ts, src/components/ThemeProvider.tsx
// Created: 2026-07-18

import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Expense } from '../models/expense';
import { RecurringExpense } from '../models/recurring';
import { forecastBalance } from '../services/forecaster';
import { formatCents } from '../utils/currency';
import { useTheme } from './ThemeProvider';
import DatePicker from './DatePicker';
import { todayIsoDate, formatDisplayDate } from '../utils/date';

interface ForecastViewProps {
  expenses: Expense[];
  recurringSchedules: RecurringExpense[];
  startingBalance: number; // cents
  startingBalanceDate: string; // YYYY-MM-DD
  onUpdateStartingBalance: (balanceCents: number, startDate: string) => Promise<void>;
}

export default function ForecastView({
  expenses,
  recurringSchedules,
  startingBalance,
  startingBalanceDate,
  onUpdateStartingBalance,
}: ForecastViewProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Settings inputs
  const [balanceInput, setBalanceInput] = useState(() => (startingBalance / 100).toString());
  const [balanceDate, setBalanceDate] = useState(startingBalanceDate);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleApplySettings() {
    setIsUpdating(true);
    try {
      const dollars = parseFloat(balanceInput.trim());
      const cents = isNaN(dollars) ? 0 : Math.round(dollars * 100);
      await onUpdateStartingBalance(cents, balanceDate);
    } catch (err) {
      // Handled in storage logic
    } finally {
      setIsUpdating(false);
    }
  }

  // Calculate projections
  const forecast = useMemo(() => {
    return forecastBalance(
      expenses,
      recurringSchedules,
      targetDate,
      todayIsoDate(),
      startingBalance,
      startingBalanceDate
    );
  }, [expenses, recurringSchedules, targetDate, startingBalance, startingBalanceDate]);

  // Local set of excluded transaction IDs for alternate forecast mapping
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());

  // Compute running balance for each forecast item factoring in active exclusions
  const { itemsWithRunningBalance, finalProjectedBalanceCents } = useMemo(() => {
    let balance = forecast.currentBalanceCents;
    const result = forecast.items.map((item) => {
      const isExcluded = excludedIds.has(item.id);
      if (!isExcluded) {
        if (item.type === 'income') {
          balance += item.amountCents;
        } else {
          balance -= item.amountCents;
        }
      }
      return {
        ...item,
        isExcluded,
        runningBalance: balance,
      };
    });
    return {
      itemsWithRunningBalance: result,
      finalProjectedBalanceCents: balance,
    };
  }, [forecast.items, forecast.currentBalanceCents, excludedIds]);

  function toggleExclusion(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function resetExclusions() {
    setExcludedIds(new Set());
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Starting Balance Setup Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Starting Balance Setup</Text>
        <Text style={styles.cardSubtitle}>
          Configure your baseline balance to calculate projected cash flows.
        </Text>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>Baseline Balance</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                value={balanceInput}
                onChangeText={setBalanceInput}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>Baseline Date</Text>
            <DatePicker date={balanceDate} onDateChange={setBalanceDate} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.applyButton, isUpdating && styles.applyButtonDisabled]}
          onPress={handleApplySettings}
          disabled={isUpdating}
          accessibilityRole="button"
          accessibilityLabel="Apply baseline balance settings"
        >
          <Text style={styles.applyButtonText}>
            {isUpdating ? 'Saving...' : 'Apply Baseline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Forecast Date Picker Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forecast Target Date</Text>
        <Text style={styles.cardSubtitle}>
          Recalculate cumulative balance trends up to any future milestone.
        </Text>
        <View style={styles.targetDateRow}>
          <DatePicker date={targetDate} onDateChange={setTargetDate} />
        </View>
      </View>

      {/* Summary Projection Columns */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCol, styles.card]}>
          <Text style={styles.summaryLabel}>Today's Balance</Text>
          <Text style={styles.summaryValue}>{formatCents(forecast.currentBalanceCents)}</Text>
        </View>
        <View style={[styles.summaryCol, styles.card]}>
          <Text style={styles.summaryLabel}>Projected Balance</Text>
          <Text
            style={[
              styles.summaryValue,
              finalProjectedBalanceCents >= 0 ? styles.positiveText : styles.negativeText,
            ]}
          >
            {formatCents(finalProjectedBalanceCents)}
          </Text>
        </View>
      </View>

      {/* Projected Cash Flow Timeline */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Projected Transactions</Text>
        {excludedIds.size > 0 && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetExclusions}
            accessibilityRole="button"
            accessibilityLabel="Reset all exclusions"
          >
            <Text style={styles.resetText}>↺ Reset Exclusions</Text>
          </TouchableOpacity>
        )}
      </View>

      {itemsWithRunningBalance.length === 0 ? (
        <View style={[styles.card, styles.emptyState]}>
          <Text style={styles.emptyText}>
            No projected transactions found in this date range. Adjust the Forecast Target Date above to project further out.
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {itemsWithRunningBalance.map((item) => {
            const isIncome = item.type === 'income';
            return (
              <View
                key={item.id}
                style={[
                  styles.timelineItem,
                  item.isExcluded && styles.timelineItemExcluded,
                ]}
              >
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={[styles.itemDate, item.isExcluded && styles.lineThrough]}>
                      {formatDisplayDate(item.date)}
                    </Text>
                    <Text style={[styles.itemCategory, item.isExcluded && styles.lineThrough]}>
                      {item.category}
                      {item.note.length > 0 && ` • ${item.note}`}
                    </Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text
                      style={[
                        styles.itemAmount,
                        item.isExcluded
                          ? styles.excludedText
                          : isIncome
                          ? styles.incomeText
                          : styles.expenseText,
                        item.isExcluded && styles.lineThrough,
                      ]}
                    >
                      {isIncome ? '+' : '-'}{formatCents(item.amountCents)}
                    </Text>
                    <Text style={styles.runningBal}>
                      Bal: {item.isExcluded ? '--' : formatCents(item.runningBalance)}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <View
                    style={[
                      styles.badge,
                      item.isExcluded
                        ? styles.badgeExcluded
                        : item.isSimulated
                        ? styles.badgeSimulated
                        : styles.badgeManual,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        item.isExcluded
                          ? styles.badgeTextExcluded
                          : item.isSimulated
                          ? styles.badgeTextSimulated
                          : styles.badgeTextManual,
                      ]}
                    >
                      {item.isExcluded
                        ? 'Excluded'
                        : item.isSimulated
                        ? 'Projected Recurring'
                        : 'Future Manual'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.excludeBtn}
                    onPress={() => toggleExclusion(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={item.isExcluded ? 'Include transaction' : 'Exclude transaction'}
                  >
                    <Text style={styles.excludeBtnText}>
                      {item.isExcluded ? '↺ Include' : '✕ Exclude'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.background,
      gap: 16,
    },
    card: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 16,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    formCol: {
      flex: 1,
      flexDirection: 'column',
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 40,
      backgroundColor: colors.surfaceSecondary,
    },
    currencySymbol: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      marginRight: 4,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      padding: 0,
      height: '100%',
    },
    applyButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonDisabled: {
      opacity: 0.6,
    },
    applyButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
    },
    targetDateRow: {
      alignSelf: 'flex-start',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
    },
    summaryCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    positiveText: {
      color: colors.success,
    },
    negativeText: {
      color: colors.error,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    timeline: {
      flexDirection: 'column',
      gap: 12,
    },
    timelineItem: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 12,
      padding: 14,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemDate: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    itemCategory: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    amountCol: {
      alignItems: 'flex-end',
    },
    itemAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    runningBal: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    incomeText: {
      color: colors.success,
    },
    expenseText: {
      color: colors.text,
    },
    itemMeta: {
      flexDirection: 'row',
      marginTop: 10,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    badgeSimulated: {
      backgroundColor: 'rgba(63, 81, 181, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(63, 81, 181, 0.2)',
    },
    badgeManual: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    badgeTextSimulated: {
      color: colors.primary,
    },
    badgeTextManual: {
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    resetButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    resetText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    timelineItemExcluded: {
      opacity: 0.45,
      borderColor: colors.borderSecondary,
    },
    lineThrough: {
      textDecorationLine: 'line-through',
    },
    excludedText: {
      color: colors.textSecondary,
    },
    badgeExcluded: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
    },
    badgeTextExcluded: {
      color: colors.textSecondary,
      opacity: 0.7,
    },
    excludeBtn: {
      marginLeft: 'auto',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      backgroundColor: colors.surfaceSecondary,
    },
    excludeBtnText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
