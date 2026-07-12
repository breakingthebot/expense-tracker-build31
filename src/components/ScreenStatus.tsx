// src/components/ScreenStatus.tsx
// Shared loading spinner / error message shown while a screen's data is
// still loading or failed to load. Extracted so ExpensesScreen and
// ChartScreen don't duplicate the same three style rules.
// Connects to: src/hooks/useExpenses.ts, src/screens/ExpensesScreen.tsx, src/screens/ChartScreen.tsx
// Created: 2026-07-12

import { ActivityIndicator, StyleSheet, Text } from 'react-native';

interface ScreenStatusProps {
  loading: boolean;
  error: string | null;
}

/** Renders a spinner while loading, an error message on failure, or nothing once ready. */
export default function ScreenStatus({ loading, error }: ScreenStatusProps) {
  if (loading) {
    return <ActivityIndicator style={styles.loadingIndicator} size="large" color="#2f6feb" />;
  }
  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: 32,
  },
  errorText: {
    color: '#c0392b',
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
});
