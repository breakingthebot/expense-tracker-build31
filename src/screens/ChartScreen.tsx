// src/screens/ChartScreen.tsx
// "Chart" tab: spending aggregates by category. Supports switching between
// a static "Monthly Breakdown" bar chart and a rolling "3-Month Trends" card list.
// Handles month navigation globally so changing the month shifts both views.
// Connects to: src/hooks/useExpenses.ts, src/services/monthlySummary.ts,
// src/services/trendSummary.ts, src/components/MonthlyChart.tsx,
// src/components/TrendChart.tsx, src/components/ScreenStatus.tsx
// Created: 2026-07-12

import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MonthlyChart from '../components/MonthlyChart';
import TrendChart from '../components/TrendChart';
import ScreenStatus from '../components/ScreenStatus';
import { useExpenses } from '../hooks/useExpenses';
import { currentMonthKey, summarizeMonth } from '../services/monthlySummary';
import { getTrendSummary } from '../services/trendSummary';
import { formatMonthLabel, shiftMonthKey } from '../utils/date';

export default function ChartScreen() {
  const { expenses, categories, loading, loadError } = useExpenses();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [viewMode, setViewMode] = useState<'monthly' | 'trend'>('monthly');

  // Compute a list of category names for monthly summary matching
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const summary = useMemo(() => summarizeMonth(expenses, monthKey), [expenses, monthKey]);
  const trendSummary = useMemo(() => getTrendSummary(expenses, monthKey), [expenses, monthKey]);

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
              style={[styles.toggleButton, viewMode === 'trend' && styles.toggleButtonActive]}
              onPress={() => setViewMode('trend')}
              accessibilityRole="button"
              accessibilityLabel="View 3-month trends list"
            >
              <Text style={[styles.toggleText, viewMode === 'trend' && styles.toggleTextActive]}>
                Trends
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Content Rendering */}
          {viewMode === 'monthly' ? (
            <MonthlyChart summary={summary} categoryColors={categoryColors} />
          ) : (
            <TrendChart
              trends={trendSummary}
              latestMonthLabel={formatMonthLabel(monthKey)}
              categoryColors={categoryColors}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#0b0b0b',
  },
  monthNavArrowDisabled: {
    color: '#c3c2b7',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 120,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
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
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    fontWeight: '600',
    color: '#2f6feb',
  },
});
