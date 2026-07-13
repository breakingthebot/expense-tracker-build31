// src/components/MonthlyChart.tsx
// Horizontal bar chart of spending by category for one month, with
// previous/next month navigation in the header. Presentational only —
// ChartScreen.tsx owns the selected month and computes the summary via
// monthlySummary.ts. Colors, bar spec, and label placement follow the
// project's data-viz standard: fixed categorical hue per category (never
// color-only — every bar carries a visible category + amount label), 4px
// rounded bar end, square baseline, labels placed outside the bar so they
// never clip.
// Connects to: src/services/monthlySummary.ts, src/config/categoryColors.ts, src/utils/currency.ts, src/screens/ChartScreen.tsx
// Created: 2026-07-12

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORY_CHART_COLORS } from '../config/categoryColors';
import { MonthlySummary } from '../services/monthlySummary';
import { formatCents } from '../utils/currency';

interface MonthlyChartProps {
  summary: MonthlySummary;
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  /** Disables the next-month arrow once the current month is reached (no future months). */
  canGoToNextMonth: boolean;
}

/** Renders the monthly category breakdown with month navigation, or an empty state if nothing was spent. */
export default function MonthlyChart({
  summary,
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  canGoToNextMonth,
}: MonthlyChartProps) {
  const maxCents = summary.categoryTotals[0]?.totalCents ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={onPreviousMonth}
          style={styles.monthNavButton}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text style={styles.monthNavArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={onNextMonth}
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

      {summary.categoryTotals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No expenses this month.</Text>
        </View>
      ) : (
        <>
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
        </>
      )}
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    color: '#0b0b0b',
  },
  monthNavArrowDisabled: {
    color: '#c3c2b7',
  },
  monthLabel: {
    fontSize: 13,
    color: '#52514e',
    minWidth: 120,
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0b0b0b',
    marginTop: 12,
    textAlign: 'center',
  },
  totalCaption: {
    fontSize: 13,
    color: '#898781',
    marginBottom: 20,
    textAlign: 'center',
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
