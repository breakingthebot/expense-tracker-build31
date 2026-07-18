// src/components/ScreenStatus.tsx
// Shared loading spinner / error message shown while a screen's data is
// still loading or failed to load. Adapts dynamically to themes.
// Connects to: src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ScreenStatusProps {
  loading: boolean;
  error: string | null;
}

/** Renders a spinner while loading, an error message on failure, or nothing once ready. */
export default function ScreenStatus({ loading, error }: ScreenStatusProps) {
  const { colors } = useTheme();

  if (loading) {
    return <ActivityIndicator style={styles.loadingIndicator} size="large" color={colors.primary} />;
  }
  if (error) {
    return <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: 32,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
});
