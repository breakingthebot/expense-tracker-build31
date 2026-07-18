// src/components/DatePicker.tsx
// Native Date Picker using @react-native-community/datetimepicker.
// Adapts styling dynamically based on the current theme context.
// Connects to: src/components/AddExpenseForm.tsx, src/components/ThemeProvider.tsx
// Created: 2026-07-18

import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDisplayDate, parseIsoDate, toIsoDate } from '../utils/date';
import { useTheme } from './ThemeProvider';

interface DatePickerProps {
  date: string; // ISO date string (yyyy-mm-dd)
  onDateChange: (newDate: string) => void;
}

export default function DatePicker({ date, onDateChange }: DatePickerProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onDateChange(toIsoDate(selectedDate));
    }
  }

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={parseIsoDate(date)}
        mode="date"
        display="compact"
        maximumDate={new Date()}
        onChange={handleDateChange}
        style={styles.iosDatePicker}
        themeVariant={colors.background === '#ffffff' ? 'light' : 'dark'}
        accessibilityLabel="Expense date"
      />
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowAndroidPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Expense date"
      >
        <Text style={styles.dateButtonText}>{formatDisplayDate(date)}</Text>
      </TouchableOpacity>
      {showAndroidPicker && (
        <DateTimePicker
          value={parseIsoDate(date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    dateButton: {
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 8,
      padding: 10,
      backgroundColor: colors.background,
    },
    dateButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    iosDatePicker: {
      alignSelf: 'flex-start',
    },
  });
