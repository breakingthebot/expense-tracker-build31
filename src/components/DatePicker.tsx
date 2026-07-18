// src/components/DatePicker.tsx
// Native Date Picker using @react-native-community/datetimepicker.
// Connects to: src/components/AddExpenseForm.tsx
// Created: 2026-07-18

import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDisplayDate, parseIsoDate, toIsoDate } from '../utils/date';

interface DatePickerProps {
  date: string; // ISO date string (yyyy-mm-dd)
  onDateChange: (newDate: string) => void;
}

export default function DatePicker({ date, onDateChange }: DatePickerProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

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

const styles = StyleSheet.create({
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#0b0b0b',
  },
  iosDatePicker: {
    alignSelf: 'flex-start',
  },
});
