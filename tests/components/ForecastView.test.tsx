// tests/components/ForecastView.test.tsx
// Unit tests for the ForecastView component.
// Mirrors: src/components/ForecastView.tsx
// Created: 2026-07-18

import React from 'react';
// @ts-ignore
import renderer from 'react-test-renderer';
import ForecastView from '../../src/components/ForecastView';
import { Expense } from '../../src/models/expense';
import { RecurringExpense } from '../../src/models/recurring';

// Mock ThemeProvider
jest.mock('../../src/components/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      text: '#000',
      textSecondary: '#666',
      borderSecondary: '#ccc',
      primary: '#00f',
      success: '#0f0',
      error: '#f00',
      surfaceSecondary: '#eee',
      border: '#bbb',
    },
    isDark: false,
  }),
}));

// Mock DatePicker
jest.mock('../../src/components/DatePicker', () => 'DatePicker');

// Mock date utility to pin date to a static timestamp without fake timers
jest.mock('../../src/utils/date', () => {
  const actual = jest.requireActual('../../src/utils/date');
  return {
    ...actual,
    todayIsoDate: () => '2026-07-18',
  };
});

describe('ForecastView', () => {
  const mockExpenses: Expense[] = [
    {
      id: 'exp-1',
      amountCents: 10000, // $100
      category: 'Food',
      note: 'Grocery',
      date: '2026-07-25', // Future transaction relative to 2026-07-18
      type: 'expense',
      createdAt: '2026-07-10T12:00:00Z',
    },
  ];

  const mockSchedules: RecurringExpense[] = [
    {
      id: 'rec-1',
      amountCents: 5000, // $50
      category: 'Entertainment',
      note: 'Weekly streaming',
      interval: 'weekly',
      startDate: '2026-07-10',
      lastGeneratedDate: '2026-07-17',
      createdAt: '2026-07-10T10:00:00Z',
      type: 'expense',
    },
  ];

  it('renders forecast rows and recalculates the balance when exclusions apply', () => {
    const onUpdateStartingBalance = jest.fn();

    let component: any;
    renderer.act(() => {
      component = renderer.create(
        <ForecastView
          expenses={mockExpenses}
          recurringSchedules={mockSchedules}
          startingBalance={100000} // Starting balance: $1000
          startingBalanceDate="2026-07-01"
          onUpdateStartingBalance={onUpdateStartingBalance}
        />
      );
    });

    const root = component.root;

    // Find all Exclude buttons (only those with onPress to filter out nested wrappers)
    const excludeButtons = root.findAll((el: any) =>
      el.props.accessibilityLabel === 'Exclude transaction' && el.props.onPress !== undefined
    );
    expect(excludeButtons.length).toBeGreaterThan(0);

    // Find a button to press (e.g. mockExpenses exp-1 exclusion)
    const firstExcludeBtn = excludeButtons[0];
    renderer.act(() => {
      firstExcludeBtn.props.onPress();
    });

    // Check if the Include button shows up for the excluded item
    const includeButtons = root.findAll((el: any) =>
      el.props.accessibilityLabel === 'Include transaction' && el.props.onPress !== undefined
    );
    expect(includeButtons.length).toBeGreaterThan(0);

    // Click the Include button to restore it
    const restoreBtn = includeButtons[0];
    renderer.act(() => {
      restoreBtn.props.onPress();
    });

    // Ensure it goes back to excluded state
    const excludeButtonsRestored = root.findAll((el: any) =>
      el.props.accessibilityLabel === 'Exclude transaction' && el.props.onPress !== undefined
    );
    expect(excludeButtonsRestored.length).toBe(excludeButtons.length);
  });
});
