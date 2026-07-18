// tests/components/AddScreen.test.tsx
// Unit tests for the AddScreen component.
// Mirrors: src/screens/AddScreen.tsx
// Created: 2026-07-18

import React from 'react';
// @ts-ignore
import renderer from 'react-test-renderer';
import AddScreen from '../../src/screens/AddScreen';

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();

// Mock React Navigation hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    setParams: mockSetParams,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

const mockAddNewExpense = jest.fn().mockResolvedValue(undefined);

// Mock useExpenses hook
jest.mock('../../src/hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: [],
    submitting: false,
    addNewExpense: mockAddNewExpense,
    editExpense: jest.fn(),
    addNewRecurringExpense: jest.fn(),
    recurringSchedules: [],
    removeRecurringExpense: jest.fn(),
    categories: [
      { id: 'cat-food', name: 'Food', color: '#2a78d6' },
      { id: 'cat-trans', name: 'Transportation', color: '#1baf7a' },
      { id: 'cat-ent', name: 'Entertainment', color: '#4a3aa7' },
    ],
    addNewCategory: jest.fn(),
    editCategoryName: jest.fn(),
    removeCategory: jest.fn(),
    budgetGoals: {},
    updateBudgetGoal: jest.fn(),
    defaultTxType: 'expense',
    setDefaultTxType: jest.fn(),
    reorderCategoriesList: jest.fn(),
  }),
}));

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

// Mock AddExpenseForm
jest.mock('../../src/components/AddExpenseForm', () => 'AddExpenseForm');
// Mock BudgetProgressWidget
jest.mock('../../src/components/BudgetProgressWidget', () => 'BudgetProgressWidget');

describe('AddScreen Quick Add Presets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders presets chips and triggers instant transaction log on press', async () => {
    let component: any;
    renderer.act(() => {
      component = renderer.create(<AddScreen />);
    });

    const root = component.root;

    // Find the Coffee preset button by its unique accessibility label
    const coffeeBtn = root.find((el: any) =>
      el.props.accessibilityLabel === 'Quick add Coffee preset' &&
      typeof el.props.onPress === 'function'
    );
    expect(coffeeBtn).toBeTruthy();

    // Click the Coffee preset
    await renderer.act(async () => {
      await coffeeBtn.props.onPress();
    });

    // Verify it added the expense with standard Coffee preset specs
    expect(mockAddNewExpense).toHaveBeenCalledWith({
      amountCents: 500, // $5.00
      category: 'Food',
      note: 'Coffee',
      date: expect.any(String), // today's date YYYY-MM-DD
      type: 'expense',
    });

    // Verify it navigated to History screen
    expect(mockNavigate).toHaveBeenCalledWith('History');
  });
});
