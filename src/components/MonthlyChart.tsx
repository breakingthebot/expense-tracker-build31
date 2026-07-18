// src/components/MonthlyChart.tsx
// Horizontal bar chart of spending/income by category for one month.
// When rendering expenses: categories with monthly budget goals display a target gauge
// where the bar track represents 100% of the budget cap. Spent progress is filled,
// turning red if exceeded. Categories without budget caps scale relative to the highest spender.
// Connects to: src/services/monthlySummary.ts, src/utils/currency.ts,
// src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MonthlySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';
import { useTheme } from './ThemeProvider';
import { TransactionType } from '../models/expense';

interface MonthlyChartProps {
  summary: MonthlySummary;
  categoryColors: Record<string, string>;
  budgetGoals: Record<string, number>;
  chartType?: TransactionType;
  onBudgetPress?: (category: string) => void;
}

/** Renders the monthly category breakdown chart with budget progress warnings. */
export default function MonthlyChart({
  summary,
  categoryColors,
  budgetGoals,
  chartType = 'expense',
  onBudgetPress,
}: MonthlyChartProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const maxCents = summary.categoryTotals[0]?.totalCents ?? 0;

  if (summary.categoryTotals.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {chartType === 'income' ? 'No income logged this month.' : 'No expenses logged this month.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.totalValue}>{formatCents(summary.totalCents)}</Text>
      <Text style={styles.totalCaption}>
        {chartType === 'income' ? 'total income' : 'total spent'}
      </Text>

      <View style={styles.rows}>
        {summary.categoryTotals.map((entry) => {
          const barColor = categoryColors[entry.category] || '#999';
          const budgetGoalCents = chartType === 'expense' ? (budgetGoals[entry.category] ?? 0) : 0;
          const isOverBudget = budgetGoalCents > 0 && entry.totalCents > budgetGoalCents;
          
          let widthPercent = 0;
          const isBudgetGauge = budgetGoalCents > 0;

          if (isBudgetGauge) {
            // Scale bar fill to the budget limit (cap at 100% visually, detail text shows overflow)
            widthPercent = Math.min(100, (entry.totalCents / budgetGoalCents) * 100);
          } else {
            // Scale bar fill relative to the highest category total in this month
            widthPercent = maxCents === 0 ? 0 : (entry.totalCents / maxCents) * 100;
          }

          const pct = budgetGoalCents > 0 ? Math.round((entry.totalCents / budgetGoalCents) * 100) : 0;

          return (
            <TouchableOpacity
              key={entry.category}
              style={styles.rowContainer}
              onPress={() => onBudgetPress?.(entry.category)}
              disabled={chartType !== 'expense' || !onBudgetPress}
              accessibilityRole="button"
              accessibilityLabel={`Edit budget goal for ${entry.category}`}
            >
              <View style={styles.row}>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {entry.category}
                </Text>
                
                {/* Bar Track: Budget gauges styled with a clean container border */}
                <View style={[styles.barTrack, isBudgetGauge && styles.budgetBarTrack]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${widthPercent}%`,
                        backgroundColor: isOverBudget ? colors.error : barColor,
                      },
                    ]}
                  />
                </View>
                
                <Text style={styles.valueLabel}>
                  {formatCents(entry.totalCents)}
                  {isOverBudget && <Text style={styles.dangerIndicator}> ⚠️</Text>}
                </Text>
              </View>

              {/* Dynamic Budget Progress Row below the gauge */}
              {isBudgetGauge ? (
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetText, isOverBudget && styles.budgetWarningText]}>
                    {isOverBudget
                      ? `⚠️ Over budget by ${formatCents(entry.totalCents - budgetGoalCents)} (${pct}%)`
                      : `${formatCents(entry.totalCents)} spent of ${formatCents(budgetGoalCents)} budget (${pct}%)`}
                  </Text>
                </View>
              ) : (
                chartType === 'expense' && (
                  <View style={styles.budgetRow}>
                    <Text style={styles.setBudgetLink}>Tap to set monthly budget goal</Text>
                  </View>
                )
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CATEGORY_LABEL_WIDTH = 100;
const VALUE_LABEL_WIDTH = 80;
const BAR_HEIGHT = 16;

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.background,
    },
    totalValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      textAlign: 'center',
    },
    totalCaption: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
    },
    rows: {
      gap: 16,
    },
    rowContainer: {
      flexDirection: 'column',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryLabel: {
      width: CATEGORY_LABEL_WIDTH,
      fontSize: 13,
      color: colors.textSecondary,
    },
    barTrack: {
      flex: 1,
      height: BAR_HEIGHT,
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 4,
      overflow: 'hidden',
    },
    budgetBarTrack: {
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      backgroundColor: colors.surface,
    },
    bar: {
      height: BAR_HEIGHT,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
      minWidth: 3,
    },
    valueLabel: {
      width: VALUE_LABEL_WIDTH,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    dangerIndicator: {
      color: colors.error,
    },
    emptyState: {
      paddingVertical: 48,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    // Budget progress labels styled under bar track
    budgetRow: {
      marginLeft: CATEGORY_LABEL_WIDTH,
      marginTop: 4,
    },
    budgetText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    budgetWarningText: {
      color: colors.error,
      fontWeight: '600',
    },
    setBudgetLink: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
  });
