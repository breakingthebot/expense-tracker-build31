// src/types/navigation.ts
// Shared navigation type definitions.
// Created: 2026-07-17

import { Expense } from '../models/expense';

export type TabParamList = {
  Add: { editingExpense?: Expense } | undefined;
  History: undefined;
  Chart: undefined;
};
