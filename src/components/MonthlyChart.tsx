// src/components/MonthlyChart.tsx
// Horizontal bar chart of spending by category for one month.
// Presentational only — ChartScreen.tsx handles month navigation,
// and computes the summary via monthlySummary.ts.
// Colors and budget goals are passed dynamically.
// Displays progress metrics and warning flags inline below the bar tracks
// if a monthly category budget goal has been configured.
// Connects to: src/services/monthlySummary.ts, src/utils/currency.ts,
// src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { StyleSheet, Text, View } from 'react-native';
import { MonthlySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';
import { useTheme } from './ThemeProvider';

interface MonthlyChartProps {
  summary: MonthlySummary;
  categoryColors: Record<string, string>;
  budgetGoals: Record<string, number>;
}

/** Renders the monthly category breakdown chart with budget progress warnings. */
export default function MonthlyChart({ summary, categoryColors, budgetGoals }: MonthlyChartProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const maxCents = summary.categoryTotals[0]?.totalCents ?? 0;

  if (summary.categoryTotals.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No expenses this month.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.totalValue}>{formatCents(summary.totalCents)}</Text>
      <Text style={styles.totalCaption}>total spent</Text>

      <View style={styles.rows}>
        {summary.categoryTotals.map((entry) => {
          const widthPercent = maxCents === 0 ? 0 : (entry.totalCents / maxCents) * 100;
          const barColor = categoryColors[entry.category] || '#999';
          const budgetGoalCents = budgetGoals[entry.category] ?? 0;
          const isOverBudget = budgetGoalCents > 0 && entry.totalCents > budgetGoalCents;
          const pct = budgetGoalCents > 0 ? Math.round((entry.totalCents / budgetGoalCents) * 100) : 0;

          return (
            <View key={entry.category} style={styles.rowContainer}>
              <View style={styles.row}>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {entry.category}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${widthPercent}%`,
                        backgroundColor: isOverBudget ? colors.error : barColor, // Change to alert color if over budget
                      },
                    ]}
                  />
                </View>
                <Text style={styles.valueLabel}>{formatCents(entry.totalCents)}</Text>
              </View>

              {/* Dynamic Budget Progress Row */}
              {budgetGoalCents > 0 && (
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetText, isOverBudget && styles.budgetWarningText]}>
                    {isOverBudget
                      ? `⚠️ Over budget by ${formatCents(entry.totalCents - budgetGoalCents)} (${formatCents(entry.totalCents)} / ${formatCents(budgetGoalCents)})`
                      : `${formatCents(entry.totalCents)} of ${formatCents(budgetGoalCents)} budget (${pct}%)`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CATEGORY_LABEL_WIDTH = 100;
const VALUE_LABEL_WIDTH = 68;
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
  });
