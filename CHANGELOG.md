# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.22.0] - 2026-07-18
### Added
- Date Range Presets & Filter. Added predefined date range calculations (`getThisWeekRange`, `getLast7DaysRange`, `getThisMonthRange`) in [date.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/utils/date.ts) and wrote unit tests in [date.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/utils/date.test.ts).
- Sleek interactive horizontal selector strip in [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx) matching other filter systems.
- Dynamic custom start/end DatePicker fields which appear only when the Custom range preset is toggled active.
- Unified calculations where the ledger dashboard cards dynamically update summary sums matching the filtered date range context.

## [0.21.0] - 2026-07-18
### Added
- Cash Flow Forecaster. Created [forecaster.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/forecaster.ts) service simulating upcoming cash flow events and estimating balances for any future date.
- Sleek interactive forecast card widget inside [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx) containing collapsible upcoming transaction scrolling lists and target date picks.
- Date math helper `addDaysToIso` in [date.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/utils/date.ts).
- Unit tests in [forecaster.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/forecaster.test.ts) (87 unit tests total).

## [0.20.0] - 2026-07-18
### Added
- Future Date Selection. Removed the calendar `maximumDate={new Date()}` boundary constraint in [DatePicker.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/DatePicker.tsx), enabling future forecasting and advance bill scheduling.

### Fixed
- Income Saving Mappings. Corrected database object builders `addExpense` and `updateExpense` in [expenseStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/expenseStorage.ts) to map and propagate transaction `type` parameters. This stops income items from incorrectly defaulting to expenses inside AsyncStorage.
- Updated database storage assertions in [expenseStorage.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/expenseStorage.test.ts).

## [0.19.0] - 2026-07-18
### Added
- Category Budget Goals Graph (Option 1). Refactored [MonthlyChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/MonthlyChart.tsx) to render visual target progress meters scaled to each category's budget cap. Spent progress is filled, turning warning red (`colors.error`) and displaying warning banners when exceeded.
- Shared Transaction Type Preference. Extended [useExpenses.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/hooks/useExpenses.ts) to store the active `'expense' | 'income'` layout state preference to `@expense_tracker/default_tx_type` in AsyncStorage.
- Default Tab Synchronization. Configured [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx) and [ChartScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/ChartScreen.tsx) to read and synchronize default transaction type states automatically. Switching toggles in one tab updates the default view on the other.
- Support for Income Category breakdowns and Trends in [monthlySummary.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/monthlySummary.ts) and [trendSummary.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/trendSummary.ts).

### Changed
- Refactored [AddExpenseForm.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/AddExpenseForm.tsx) to hook transaction type switches into the `onTypeChange` synchronizer.

## [0.18.0] - 2026-07-18
### Added
- Visual Improvements & Theme Selector. Implemented [ThemeProvider.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/ThemeProvider.tsx) exporting a react navigation styling context.
- Light, Dark, and OLED Black color palettes dynamically rendering text, inputs, cards, borders, and loaders.
- Sleek emoji theme toggle selector buttons (☀️, 🌙, 🕶️) at the top of the ledger dashboard.
- Dynamic Status Bar styling updates based on active themes.
- 3 new unit tests in [themeStorage.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/themeStorage.test.ts) (86 tests total).

### Changed
- Integrated [themeStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/themeStorage.ts) persisting theme mode selections to AsyncStorage.
- Refactored [App.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/App.tsx) bottom navigation tab styling.
- Adapted [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx), [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx), and [ChartScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/ChartScreen.tsx) containers to scale theme background colors dynamically.
- Refactored components [AddExpenseForm.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/AddExpenseForm.tsx), [ExpenseList.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/ExpenseList.tsx), [MonthlyChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/MonthlyChart.tsx), [TrendChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/TrendChart.tsx), [DatePicker.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/DatePicker.tsx), and [ScreenStatus.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/ScreenStatus.tsx) to hook into `useTheme()`.
- Expanded recurring models in [recurring.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/models/recurring.ts) and generator in [recurringGenerator.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/recurringGenerator.ts) to support transaction types.

## [0.17.0] - 2026-07-18
### Added
- CSV Data Import feature. Created [csvParser.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/utils/csvParser.ts) parsing RFC 4180 strings and quote-enclosed cells.
- Spreadsheet validation service in [csvImport.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/csvImport.ts) collecting row problems and mapping case-insensitive headers.
- Browser file picker overlay Modal in [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx) with validation badges, preview scrolling row grids, and confirm import actions.
- CSV Import triggering links in FlatList headers in [ExpenseList.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/ExpenseList.tsx).
- 4 new unit tests (83 tests total) across [csvParser.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/utils/csvParser.test.ts) and [csvImport.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/csvImport.test.ts).

### Changed
- Refactored [expenseStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/expenseStorage.ts) to support bulk saves `addExpensesBulk` in a single atomic write.
- Updated [expenseStorage.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/expenseStorage.test.ts) to verify atomic batch write arrays.
- Expanded [useExpenses.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/hooks/useExpenses.ts) actions to manage CSV parser flows and cycle-seeding colors for imported categories.

## [0.16.0] - 2026-07-18
### Added
- Income & Net Balance tracking. Added `type?: 'expense' | 'income'` support to the [Expense](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/models/expense.ts) data model and validation.
- Top-level segmented toggles (Expense/Income) in [AddExpenseForm.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/AddExpenseForm.tsx) styled dynamically based on transaction types.
- A premium, multi-column dashboard summary card (Income, Spent, Net Balance) at the top of the ledger on [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx).
- Highlighting for income items in [ExpenseList.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/ExpenseList.tsx) (displaying green positive values `+$X.XX`).
- Appended `Type` column to CSV headers and cell mapping in [csv.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/utils/csv.ts).
- 3 new unit tests (70 tests total) across [expense.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/models/expense.test.ts), [monthlySummary.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/monthlySummary.test.ts), and [trendSummary.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/trendSummary.test.ts).

### Changed
- Filtered out income transactions from category breakdowns in [monthlySummary.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/monthlySummary.ts) and trend calculations in [trendSummary.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/trendSummary.ts).
- Refactored [expenseExport.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/expenseExport.test.ts) and [csv.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/utils/csv.test.ts) to verify transaction type columns.

## [0.15.0] - 2026-07-18
### Added
- Monthly category budget goals. Created [budgetStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/budgetStorage.ts) to read, write, and clear spending limits.
- Inline budget configuration setters inside the categories modal on [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx).
- Real-time spending progress bars and warning status labels (e.g. `⚠️ Over budget by $X.XX`) aligned underneath horizontal tracks in [MonthlyChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/MonthlyChart.tsx).
- 3 new unit tests in [budgetStorage.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/budgetStorage.test.ts) (67 tests total).

### Changed
- Refactored [categoryStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/categoryStorage.ts) to cascade rename and delete updates to budget goals.
- Expanded [categoryStorage.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/categoryStorage.test.ts) to verify budget cascades.
- Updated [useExpenses.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/hooks/useExpenses.ts) and [ChartScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/ChartScreen.tsx) to coordinate budget target loaders and data props.

## [0.14.0] - 2026-07-18
### Added
- Dynamic category creation and management. Created [categoryStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/categoryStorage.ts) to seed 8 default categories, validate additions, handle inline renaming, and perform cascading updates on rename and delete events.
- Inline category editing modal inside [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx) with double-tap delete confirmations and a custom 12-color swatch picker.
- Exposed CRUD triggers in `useExpenses` hook and loaded them on focus.
- 5 new unit tests under [categoryStorage.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/categoryStorage.test.ts) (64 tests total).

### Changed
- Refactored [categories.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/config/categories.ts) to support dynamic type definitions.
- Refactored [expense.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/models/expense.ts) validation checks to verify non-empty string categories instead of static arrays.
- Refactored [AddExpenseForm.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/AddExpenseForm.tsx) and [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx) to read dynamic categories.
- Decoupled [MonthlyChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/MonthlyChart.tsx) and [TrendChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/TrendChart.tsx) from static color config files, passing colors dynamically from [ChartScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/ChartScreen.tsx) based on user configuration.

## [0.13.0] - 2026-07-18
### Added
- Automatic recurring expenses generation. Created [recurring.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/models/recurring.ts) schemas, [recurringGenerator.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/recurringGenerator.ts) billing calculators (handling daily, weekly, monthly, yearly cycles, month-end capping, and leap years), and [recurringStorage.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/recurringStorage.ts) for Async Storage multiSet transactions.
- Repeat toggles inside [AddExpenseForm.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/AddExpenseForm.tsx) and scheduled billing managers scrollably placed on [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx).
- De-duplicated local ID generations in [id.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/utils/id.ts).
- 5 new tests in [recurringGenerator.test.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/tests/services/recurringGenerator.test.ts) (59 tests total).

### Changed
- Integrated recurring expense check triggers inside [useExpenses.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/hooks/useExpenses.ts) focus refresh hooks.

## [0.12.0] - 2026-07-18
### Added
- Platform-split date picking components: [DatePicker.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/DatePicker.tsx) (native iOS/Android datetimepicker) and [DatePicker.web.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/DatePicker.web.tsx) (HTML5 date input for web compatibility).
- Web dependencies: `react-native-web`, `react-dom`, and `@expo/metro-runtime` to enable Expo web compilation.
- Vercel configuration: [vercel.json](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/vercel.json) and [.vercelignore](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/.vercelignore) for static deployments.
- Package `"build"` script executing `expo export --platform web`.

### Changed
- [AddExpenseForm.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/AddExpenseForm.tsx) refactored to use the platform-split `DatePicker` component, resolving web compatibility runtime crashes.

## [0.11.0] - 2026-07-17
### Added
- Rolling 3-month spending trends calculation service under [trendSummary.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/trendSummary.ts).
- Category trend card list [TrendChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/TrendChart.tsx) rendering 3-month vertical column sparklines, monthly breakdowns, and color-coded percentage indicators (+/- %).
- 2 new unit tests for the trend calculation service (54 total).

### Changed
- [ChartScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/ChartScreen.tsx) updated with a custom view selector (`Breakdown` / `Trends`) and a unified, fixed month-navigation header.
- [MonthlyChart.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/MonthlyChart.tsx) simplified to remove its local navigation headers and arrows.

## [0.10.0] - 2026-07-17
### Added
- Sticky search and filter tools on [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx):
  - TextInput query search with cross-platform clear button.
  - Horizontal scrollable filter chip row mapping categories, plus an "All" reset trigger.
- Contextual empty state in [ExpenseList.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/ExpenseList.tsx) showing `"No matching expenses found."` when filters return empty results.
- Filtered CSV reports: the export trigger now compiles only the active filtered subset of transactions, allowing users to export category- or query-specific spreadsheet reports.

## [0.9.0] - 2026-07-17
### Added
- Split the ledger screen: created [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx) (for logging/editing transactions) and [HistoryScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/HistoryScreen.tsx) (for displaying history, deletion, and CSV exports).
- Type-safe navigation parameters via [navigation.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/types/navigation.ts) parameter lists.
- Keyboard-aware scroll container wrapping `AddExpenseForm` in the dedicated input screen.

### Changed
- [App.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/App.tsx) bottom navigator updated to a 3-tab layout (Add, History, Chart).
- Tapping an expense in the ledger list now navigates to the input tab, passing parameters to seed edit fields. Completed edits clear parameters and return the user to the ledger.
- Deleted the old monolithic `src/screens/ExpensesScreen.tsx`.

## [0.8.0] - 2026-07-17
### Added
- Local CSV data export feature (under [csv.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/utils/csv.ts) and [expenseExport.ts](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/services/expenseExport.ts)), utilizing `expo-file-system/legacy` for temporary caching and `expo-sharing` to launch native sharing sheet options.
- UI triggers: "Export CSV" link added in the transaction list header row.
- 10 new tests covering CSV formatting logic and native file writing/sharing mock states (52 total).

### Changed
- [ExpensesScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/ExpensesScreen.tsx) updated to coordinate file-sharing operations, loading states, and catch failure states into user-friendly `Alert` dialogs.

## [0.7.0] - 2026-07-12
### Added
- Month navigation on the Chart tab: `‹ ›` arrows to browse prior months, disabled going past the current month.
- `shiftMonthKey(monthKey, deltaMonths)` in `src/utils/date.ts`, handling year rollover.
- 6 new date-utility tests (42 total).

### Changed
- `MonthlyChart` now takes `onPreviousMonth`, `onNextMonth`, `canGoToNextMonth` props and always renders its header (previously the empty-state branch only showed the month label with no way to navigate away from it).
- `ChartScreen` owns `monthKey` as state instead of a fixed current-month `useMemo`.

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
