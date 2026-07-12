// src/screens/ChartScreen.tsx
// "Chart" tab: this month's spending breakdown by category. Data comes
// from useExpenses(), which reloads whenever this screen regains focus,
// so switching here after adding an expense on the Expenses tab shows
// the updated total right away.
// Connects to: src/hooks/useExpenses.ts, src/services/monthlySummary.ts,
// src/components/MonthlyChart.tsx, src/components/ScreenStatus.tsx
// Created: 2026-07-12

import { useMemo } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MonthlyChart from '../components/MonthlyChart';
import ScreenStatus from '../components/ScreenStatus';
import { useExpenses } from '../hooks/useExpenses';
import { currentMonthKey, summarizeMonth } from '../services/monthlySummary';
import { formatMonthLabel } from '../utils/date';

export default function ChartScreen() {
  const { expenses, loading, loadError } = useExpenses();
  const monthKey = useMemo(() => currentMonthKey(), []);
  const summary = useMemo(() => summarizeMonth(expenses, monthKey), [expenses, monthKey]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenStatus loading={loading} error={loadError} />
      {!loading && !loadError && (
        <MonthlyChart summary={summary} monthLabel={formatMonthLabel(monthKey)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
