// src/screens/ChartScreen.tsx
// "Chart" tab: spending breakdown by category for a selected month,
// defaulting to the current month, with arrows to browse prior months
// (never into the future). Data comes from useExpenses(), which reloads
// whenever this screen regains focus, so switching here after adding an
// expense on the Expenses tab shows the updated total right away.
// Connects to: src/hooks/useExpenses.ts, src/services/monthlySummary.ts,
// src/components/MonthlyChart.tsx, src/components/ScreenStatus.tsx
// Created: 2026-07-12

import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MonthlyChart from '../components/MonthlyChart';
import ScreenStatus from '../components/ScreenStatus';
import { useExpenses } from '../hooks/useExpenses';
import { currentMonthKey, summarizeMonth } from '../services/monthlySummary';
import { formatMonthLabel, shiftMonthKey } from '../utils/date';

export default function ChartScreen() {
  const { expenses, loading, loadError } = useExpenses();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const summary = useMemo(() => summarizeMonth(expenses, monthKey), [expenses, monthKey]);
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
        <MonthlyChart
          summary={summary}
          monthLabel={formatMonthLabel(monthKey)}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          canGoToNextMonth={canGoToNextMonth}
        />
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
