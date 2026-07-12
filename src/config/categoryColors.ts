// src/config/categoryColors.ts
// Fixed categorical color assigned to each expense category, used by the
// monthly chart and (for consistency) anywhere else category identity is
// shown. Values come from the project's validated data-viz palette:
// 8 hues, fixed order, CVD-checked adjacent pairs (see BUILD_NOTES.md
// Iteration 3 for the validation notes). Never reorder these slots.
// Connects to: src/config/categories.ts, src/components/MonthlyChart.tsx
// Created: 2026-07-12

import { ExpenseCategory } from './categories';

export const CATEGORY_CHART_COLORS: Record<ExpenseCategory, string> = {
  Food: '#2a78d6',
  Transportation: '#1baf7a',
  Housing: '#eda100',
  Utilities: '#008300',
  Entertainment: '#4a3aa7',
  Health: '#e34948',
  Shopping: '#e87ba4',
  Other: '#eb6834',
};
