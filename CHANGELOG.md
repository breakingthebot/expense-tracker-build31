# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.6.0] - 2026-07-12
### Added
- Edit existing expenses: tap a row in the list to edit it. `AddExpenseForm` now supports an `editingExpense` prop (pre-filled fields, "Edit Expense" heading, "Save Changes" button, Cancel button).
- `updateExpense(id, input)` in `src/services/expenseStorage.ts`; `editExpense(id, input)` in `src/hooks/useExpenses.ts`.
- `centsToInputString(amountCents)` in `src/utils/currency.ts`.
- 7 new tests (36 total): `updateExpense` CRUD behavior and `centsToInputString`.

### Changed
- `ExpenseList` rows are now tappable (edit) in addition to the existing Delete link; `onEdit` is a new required prop.

## [0.5.0] - 2026-07-12
### Added
- Editable Date field on the add-expense form, via `@react-native-community/datetimepicker` (iOS: inline compact picker; Android: button opening the native dialog). Dates can't be set in the future.
- `toIsoDate(date: Date)` and `parseIsoDate(isoDate: string)` in `src/utils/date.ts`.
- 5 new date-utility tests (29 total).

### Changed
- `todayIsoDate()` and `formatDisplayDate()` refactored to reuse `toIsoDate`/`parseIsoDate` instead of duplicating date-construction logic.
- `app.json`: fixed `name`/`slug` still saying "expense-tracker-scaffold-tmp" from the original scaffold (was never updated in Iteration 1) — now "Expense Tracker" / "expense-tracker".

## [0.4.0] - 2026-07-12
### Added
- Bottom tab navigation (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`), replacing the manual Expenses/Chart toggle button.
- `src/screens/ExpensesScreen.tsx` and `src/screens/ChartScreen.tsx` as the two tab routes.
- `src/hooks/useExpenses.ts`: shared data hook (load/add/delete), reloading on screen focus via `useFocusEffect`.
- `src/components/ScreenStatus.tsx`: shared loading/error view for both screens.

### Changed
- `App.tsx` is now the navigation root only; all screen-specific state moved into `useExpenses()` and the two screen components.

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
