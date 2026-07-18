// src/components/WeeklyChart.tsx
// Horizontal bar chart showing spending or income grouped by weeks of the current month.
// Connects to: src/services/monthlySummary.ts, src/utils/currency.ts,
// src/components/ThemeProvider.tsx
// Created: 2026-07-18

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MonthlyWeeklySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';
import { useTheme } from './ThemeProvider';
import { TransactionType } from '../models/expense';

interface WeeklyChartProps {
  summary: MonthlyWeeklySummary;
  chartType?: TransactionType;
  weeklyGoal: number; // in cents
  onWeeklyGoalPress?: () => void;
}

const WEEK_RANGES: Record<string, string> = {
  'Week 1': '1st – 7th',
  'Week 2': '8th – 14th',
  'Week 3': '15th – 21st',
  'Week 4': '22nd – 28th',
  'Week 5': '29th+',
};

export default function WeeklyChart({
  summary,
  chartType = 'expense',
  weeklyGoal,
  onWeeklyGoalPress,
}: WeeklyChartProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const showWeeklyGoal = chartType === 'expense';
  
  // Max cents for scaling the bar width
  const rawMax = Math.max(...summary.weeklyTotals.map((w) => w.totalCents), 0);
  const maxCents = showWeeklyGoal && weeklyGoal > 0 ? Math.max(rawMax, weeklyGoal) : rawMax;

  if (summary.totalCents === 0) {
    return (
      <View style={styles.emptyState}>
        {showWeeklyGoal && onWeeklyGoalPress && (
          <TouchableOpacity
            style={styles.goalBanner}
            onPress={onWeeklyGoalPress}
            accessibilityRole="button"
            accessibilityLabel="Set or edit weekly spending goal limit"
          >
            <Text style={styles.goalBannerText}>
              {weeklyGoal > 0
                ? `Weekly Spending Limit: ${formatCents(weeklyGoal)}`
                : 'Tap to set a weekly spending limit'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.emptyStateText}>
          {chartType === 'income'
            ? 'No income logged in this month.'
            : 'No expenses logged in this month.'}
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

      {showWeeklyGoal && onWeeklyGoalPress && (
        <TouchableOpacity
          style={styles.goalBanner}
          onPress={onWeeklyGoalPress}
          accessibilityRole="button"
          accessibilityLabel="Set or edit weekly spending goal limit"
        >
          <Text style={styles.goalBannerText}>
            {weeklyGoal > 0
              ? `Weekly Spending Limit: ${formatCents(weeklyGoal)}`
              : 'Tap to set a weekly spending limit'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.rows}>
        {summary.weeklyTotals.map((entry) => {
          const widthPercent = maxCents === 0 ? 0 : (entry.totalCents / maxCents) * 100;
          const percentage = summary.totalCents === 0 ? 0 : Math.round((entry.totalCents / summary.totalCents) * 100);
          const rangeLabel = WEEK_RANGES[entry.weekLabel] || '';
          
          const isOverGoal = showWeeklyGoal && weeklyGoal > 0 && entry.totalCents > weeklyGoal;
          const barColor = chartType === 'income'
            ? colors.success
            : (isOverGoal ? colors.error : colors.primary);

          return (
            <View key={entry.weekLabel} style={styles.rowContainer}>
              <View style={styles.row}>
                <View style={styles.labelCol}>
                  <Text style={styles.weekLabel}>{entry.weekLabel}</Text>
                  {rangeLabel.length > 0 && <Text style={styles.rangeLabel}>{rangeLabel}</Text>}
                </View>

                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${widthPercent}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                  {/* Subtle limit line indicator overlay */}
                  {showWeeklyGoal && weeklyGoal > 0 && (
                    <View
                      style={[
                        styles.limitIndicator,
                        { left: `${(weeklyGoal / maxCents) * 100}%` }
                      ]}
                    />
                  )}
                </View>

                <Text style={styles.valueLabel}>{formatCents(entry.totalCents)}</Text>
              </View>

              <View style={styles.pctRow}>
                {entry.totalCents > 0 && (
                  <Text style={styles.pctText}>
                    {percentage}% of monthly {chartType === 'income' ? 'income' : 'spending'}
                  </Text>
                )}
                {isOverGoal && (
                  <Text style={styles.overGoalText}>
                    ⚠️ Over weekly limit by {formatCents(entry.totalCents - weeklyGoal)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const LABEL_WIDTH = 75;
const VALUE_WIDTH = 80;
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
      marginBottom: 12,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
    },
    goalBanner: {
      alignSelf: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 20,
    },
    goalBannerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
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
    labelCol: {
      width: LABEL_WIDTH,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    weekLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    rangeLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    barTrack: {
      flex: 1,
      height: BAR_HEIGHT,
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 4,
      position: 'relative',
    },
    bar: {
      height: BAR_HEIGHT,
      borderRadius: 4,
      minWidth: 3,
    },
    limitIndicator: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1.5,
      backgroundColor: colors.border,
      opacity: 0.8,
    },
    valueLabel: {
      width: VALUE_WIDTH,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    pctRow: {
      marginLeft: LABEL_WIDTH,
      marginTop: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    pctText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    overGoalText: {
      fontSize: 11,
      fontWeight: '600',
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
  });
