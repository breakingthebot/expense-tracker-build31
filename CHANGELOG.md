# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-07-12
### Added
- Monthly spending chart: horizontal bar per category for the current month (`src/components/MonthlyChart.tsx`), backed by a pure aggregation function (`src/services/monthlySummary.ts`).
- Fixed categorical color per expense category (`src/config/categoryColors.ts`), from a validated 8-hue colorblind-safe palette.
- `formatMonthLabel` date helper ("2026-07" → "July 2026").
- "Expenses" / "Chart" toggle in `App.tsx` to switch views without adding a navigation dependency.
- 9 new tests covering month aggregation and the month-label formatter (24 total).

## [0.2.0] - 2026-07-12
### Added
- GitHub Actions CI workflow (`.github/workflows/ci.yml`): runs on every push/PR to `main`, installs with `npm ci`, then runs `typecheck` and the Jest suite.
- CI status badge and a "Continuous integration" section in the README.

## [0.1.0] - 2026-07-12
### Added
- Expo (TypeScript) project scaffold.
- `Expense` model with validation (`src/models/expense.ts`).
- Fixed expense category list (`src/config/categories.ts`).
- Local storage service backed by AsyncStorage, with add/list/delete (`src/services/expenseStorage.ts`).
- Add Expense form component with inline validation (`src/components/AddExpenseForm.tsx`).
- Expense list component with delete action and empty state (`src/components/ExpenseList.tsx`).
- App screen wiring loading/error/list state to the storage service (`App.tsx`).
- Currency and date formatting utilities (`src/utils/currency.ts`, `src/utils/date.ts`).
- Minimal structured logger (`src/utils/logger.ts`).
- Jest test suite for the expense model and storage service (15 tests).
- MIT License, `.env.example`, `.vscode/settings.json`.
