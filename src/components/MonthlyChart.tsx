// src/components/MonthlyChart.tsx
// Horizontal bar chart of spending by category for one month.
// Presentational only — ChartScreen.tsx handles month navigation,
// and computes the summary via monthlySummary.ts.
// Colors and budget goals are passed dynamically.
// Displays progress metrics and warning flags inline below the bar tracks
// if a monthly category budget goal has been configured.
// Connects to: src/services/monthlySummary.ts, src/utils/currency.ts, src/screens/ChartScreen.tsx
// Created: 2026-07-12

import { StyleSheet, Text, View } from 'react-native';
import { MonthlySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';

interface MonthlyChartProps {
  summary: MonthlySummary;
  categoryColors: Record<string, string>;
  budgetGoals: Record<string, number>;
}

/** Renders the monthly category breakdown chart with budget progress warnings. */
export default function MonthlyChart({ summary, categoryColors, budgetGoals }: MonthlyChartProps) {
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
                        backgroundColor: isOverBudget ? '#ef4444' : barColor, // Change to alert color if over budget
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  totalCaption: {
    fontSize: 13,
    color: '#888',
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
    color: '#555',
  },
  barTrack: {
    flex: 1,
    height: BAR_HEIGHT,
    justifyContent: 'center',
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
    color: '#333',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  // Budget progress labels styled under bar track
  budgetRow: {
    marginLeft: CATEGORY_LABEL_WIDTH,
    marginTop: 4,
  },
  budgetText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  budgetWarningText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
