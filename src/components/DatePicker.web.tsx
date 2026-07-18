// src/components/DatePicker.web.tsx
// Web-specific Date Picker using standard HTML5 date input.
// Connects to: src/components/AddExpenseForm.tsx
// Created: 2026-07-18

import { StyleSheet, View } from 'react-native';

interface DatePickerProps {
  date: string; // ISO date string (yyyy-mm-dd)
  onDateChange: (newDate: string) => void;
}

export default function DatePicker({ date, onDateChange }: DatePickerProps) {
  // Today's date in yyyy-mm-dd format for max date boundary
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <input
        type="date"
        value={date}
        max={todayStr}
        onChange={(e) => onDateChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          fontSize: '14px',
          color: '#333',
          backgroundColor: '#fff',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
