// src/components/WeeklyChart.tsx
// Horizontal bar chart showing spending or income grouped by weeks of the current month.
// Connects to: src/services/monthlySummary.ts, src/utils/currency.ts,
// src/components/ThemeProvider.tsx
// Created: 2026-07-18

import { StyleSheet, Text, View } from 'react-native';
import { MonthlyWeeklySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';
import { useTheme } from './ThemeProvider';
import { TransactionType } from '../models/expense';

interface WeeklyChartProps {
  summary: MonthlyWeeklySummary;
  chartType?: TransactionType;
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
}: WeeklyChartProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const maxCents = Math.max(...summary.weeklyTotals.map((w) => w.totalCents), 0);

  if (summary.totalCents === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {chartType === 'income'
            ? 'No income logged in this month.'
            : 'No expenses logged in this month.'}
        </Text>
      </View>
    );
  }

  const barColor = chartType === 'income' ? colors.success : colors.primary;

  return (
    <View style={styles.container}>
      <Text style={styles.totalValue}>{formatCents(summary.totalCents)}</Text>
      <Text style={styles.totalCaption}>
        {chartType === 'income' ? 'total income' : 'total spent'}
      </Text>

      <View style={styles.rows}>
        {summary.weeklyTotals.map((entry) => {
          const widthPercent = maxCents === 0 ? 0 : (entry.totalCents / maxCents) * 100;
          const percentage = summary.totalCents === 0 ? 0 : Math.round((entry.totalCents / summary.totalCents) * 100);
          const rangeLabel = WEEK_RANGES[entry.weekLabel] || '';

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
                </View>

                <Text style={styles.valueLabel}>{formatCents(entry.totalCents)}</Text>
              </View>

              {entry.totalCents > 0 && (
                <View style={styles.pctRow}>
                  <Text style={styles.pctText}>
                    {percentage}% of monthly {chartType === 'income' ? 'income' : 'spending'}
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
      overflow: 'hidden',
    },
    bar: {
      height: BAR_HEIGHT,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
      minWidth: 3,
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
    },
    pctText: {
      fontSize: 11,
      color: colors.textSecondary,
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
