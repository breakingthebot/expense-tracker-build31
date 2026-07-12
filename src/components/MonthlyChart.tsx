// src/components/MonthlyChart.tsx
// Horizontal bar chart of spending by category for one month. Presentational
// only — App.tsx computes the summary via monthlySummary.ts and passes it
// down. Colors, bar spec, and label placement follow the project's data-viz
// standard: fixed categorical hue per category (never color-only — every
// bar carries a visible category + amount label), 4px rounded bar end,
// square baseline, labels placed outside the bar so they never clip.
// Connects to: src/services/monthlySummary.ts, src/config/categoryColors.ts, src/utils/currency.ts, App.tsx
// Created: 2026-07-12

import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_CHART_COLORS } from '../config/categoryColors';
import { MonthlySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';

interface MonthlyChartProps {
  summary: MonthlySummary;
  monthLabel: string;
}

/** Renders the monthly category breakdown, or an empty state if nothing was spent. */
export default function MonthlyChart({ summary, monthLabel }: MonthlyChartProps) {
  if (summary.categoryTotals.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No expenses yet this month.</Text>
        </View>
      </View>
    );
  }

  const maxCents = summary.categoryTotals[0].totalCents;

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <Text style={styles.totalValue}>{formatCents(summary.totalCents)}</Text>
      <Text style={styles.totalCaption}>total spent</Text>

      <View style={styles.rows}>
        {summary.categoryTotals.map((entry) => {
          const widthPercent = maxCents === 0 ? 0 : (entry.totalCents / maxCents) * 100;
          return (
            <View key={entry.category} style={styles.row}>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {entry.category}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${widthPercent}%`,
                      backgroundColor: CATEGORY_CHART_COLORS[entry.category],
                    },
                  ]}
                />
              </View>
              <Text style={styles.valueLabel}>{formatCents(entry.totalCents)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CATEGORY_LABEL_WIDTH = 100;
const VALUE_LABEL_WIDTH = 68;
const BAR_HEIGHT = 20;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  monthLabel: {
    fontSize: 13,
    color: '#52514e',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0b0b0b',
    marginTop: 2,
  },
  totalCaption: {
    fontSize: 13,
    color: '#898781',
    marginBottom: 20,
  },
  rows: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    width: CATEGORY_LABEL_WIDTH,
    fontSize: 13,
    color: '#52514e',
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
    color: '#0b0b0b',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#898781',
    textAlign: 'center',
  },
});
