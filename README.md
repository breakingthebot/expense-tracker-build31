# Expense Tracker

[![CI](https://github.com/breakingthebot/expense-tracker-build31/actions/workflows/ci.yml/badge.svg)](https://github.com/breakingthebot/expense-tracker-build31/actions/workflows/ci.yml)

A React Native (Expo) mobile app for logging expenses and browsing them, with everything stored locally on the device.

## Stack
- React Native + Expo (TypeScript, managed workflow)
- `@react-native-async-storage/async-storage` for on-device local storage
- `@react-navigation/native` + `@react-navigation/bottom-tabs` for the Expenses/Chart tab navigation
- `@react-native-community/datetimepicker` for the native date picker
- Jest (`jest-expo` preset) for tests
- `expo-file-system` (legacy module) for temporary on-device file writing
- `expo-sharing` for launching native sharing sheets

## Setup
1. Install [Node.js](https://nodejs.org/) 20 or newer.
2. Install the [Expo Go](https://expo.dev/go) app on your phone (iOS or Android), or set up an iOS/Android simulator.
3. Clone this repo, then install dependencies:
   ```bash
   npm install
   ```

## Environment Variables
None required yet. This app is local-only — no server, no API keys. See `.env.example` for a placeholder that future iterations (e.g. cloud sync) can fill in.

## Running Locally
```bash
npm start
```
This opens the Expo developer tools. Scan the QR code with the Expo Go app on your phone, or press `i` / `a` in the terminal to launch an iOS/Android simulator.

Other useful commands:
```bash
npm test         # run the test suite
npm run typecheck  # check types with tsc
```

## Deployed
The application is deployed on Vercel as a mobile-friendly web app at:
[https://expense-tracker-build31.vercel.app](https://expense-tracker-build31.vercel.app)

## Data Handling
- All expense data (amount, category, note, date) is stored only on the device, using AsyncStorage. Nothing is sent to a server.
- No account, sign-in, or personal identifying information is collected.
- Deleting the app removes all stored expense data.
- CSV data export is entirely local and user-initiated; the exported file is stored in a temporary device directory and shared using the system sharing dialog.

## Architecture Notes
This iteration builds the core vertical slice: add an expense and see it in a list, backed by local storage.

- `src/models/expense.ts` defines the `Expense` shape and validates new expense input (positive amount, known category, valid date, note length) before anything is saved.
- `src/config/categories.ts` holds the fixed list of categories, kept separate from the model so the UI and the model both reference a single source of truth.
- `src/services/expenseStorage.ts` is the only module that talks to AsyncStorage. It reads/writes a single JSON array under one storage key, and is the boundary where validation errors and storage errors turn into user-facing messages.
- `src/components/AddExpenseForm.tsx` and `src/components/ExpenseList.tsx` are presentational — they don't know about AsyncStorage directly, only about the callbacks and data passed to them.
- Money is stored as integer cents (`amountCents`), not floating-point dollars, so totals (like the monthly chart) sum exactly instead of accumulating rounding errors.

### Monthly chart (Iteration 3)
- `src/services/monthlySummary.ts` is a pure aggregation function: given the full expense list and a `yyyy-mm` key, it sums `amountCents` per category for that month, drops categories with no spending, and sorts highest-first. No AsyncStorage dependency, so it's trivial to unit test.
- `src/config/categoryColors.ts` assigns each category a fixed hex color from a validated categorical palette (8 hues, fixed order, checked for colorblind-safe separation between adjacent slots — see `BUILD_NOTES.md` for the validator output). The same category always gets the same color, so it stays recognizable between the form's category chips and the chart.
- `src/components/MonthlyChart.tsx` renders a horizontal bar per category — bar length relative to the month's largest category, category name and dollar amount as plain text next to every bar (never color-only, since three of the eight palette colors don't meet 3:1 text contrast on their own).
- The chart currently only supports light mode (matching the rest of the app, which doesn't yet theme for dark mode either). Device dark-mode support is listed as a future candidate rather than theming one component in isolation.

### Navigation (Iteration 4)
- `App.tsx` is now the navigation root: `@react-navigation/bottom-tabs` renders two tabs, Expenses and Chart, replacing the earlier manual toggle button.
- `src/screens/ExpensesScreen.tsx` and `src/screens/ChartScreen.tsx` are the two tab routes. Each composes existing presentational components (`AddExpenseForm` + `ExpenseList`, or `MonthlyChart`) rather than owning any new UI logic itself.
- `src/hooks/useExpenses.ts` centralizes expense loading/add/delete (previously inline in `App.tsx`). It reloads via `useFocusEffect` whenever its screen regains focus, so adding an expense on the Expenses tab and switching to Chart shows the updated total immediately — no shared global state needed for two screens.
- `src/components/ScreenStatus.tsx` is the shared loading-spinner/error-message view, extracted once both screens needed the same three style rules.

### Editable date picker (Iteration 5)
- `src/components/AddExpenseForm.tsx` now has a real Date field instead of always defaulting silently to today. iOS renders `@react-native-community/datetimepicker`'s `display="compact"` mode directly inline (a small self-contained pill — no show/hide state needed). Android renders a text button showing the selected date; tapping it opens the platform's native date dialog, which is only mounted in the tree while open (Android's picker is dialog-based, not inline, so this is the standard pattern for the library).
- Dates can't be set in the future (`maximumDate={new Date()}`) — you can't log an expense that hasn't happened yet.
- `src/utils/date.ts` gained `toIsoDate(date: Date)` and `parseIsoDate(isoDate: string)` to convert between the picker's native `Date` objects and the app's stored `yyyy-mm-dd` strings; `todayIsoDate()` and `formatDisplayDate()` were refactored to reuse them instead of duplicating the same construction logic.
- The picked date is *not* reset back to today after adding an expense (unlike the amount and note fields) — if you're logging several expenses from the same earlier day in a row, you don't want to re-pick the date every time.

### Edit existing expenses (Iteration 6)
- Tapping an expense row in the list now edits it, instead of only being able to delete and re-add. `src/components/AddExpenseForm.tsx` takes an optional `editingExpense` prop: when set, the form pre-fills from that expense, the heading becomes "Edit Expense," the submit button becomes "Save Changes," and a "Cancel" button appears to back out without saving.
- `src/screens/ExpensesScreen.tsx` renders `<AddExpenseForm key={editingExpense?.id ?? 'new'} .../>` — remounting the form (rather than trying to sync its internal state via an effect) whenever the edit target changes, so switching from adding to editing, or between editing two different expenses, always starts from clean, correctly pre-filled field state.
- `src/services/expenseStorage.ts` gained `updateExpense(id, input)`: same validation as `addExpense`, but overwrites an existing record's fields while keeping its `id` and original `createdAt`.
- `src/hooks/useExpenses.ts` gained `editExpense(id, input)`, following the same submitting/refresh pattern as `addNewExpense`.
- `src/utils/currency.ts` gained `centsToInputString(amountCents)` — the inverse of `parseDollarsToCents`, used to pre-fill the amount field with a plain "12.50" instead of the currency-formatted "$12.50" from `formatCents`.

### Month navigation on the chart (Iteration 7)
- `src/components/MonthlyChart.tsx` now renders `‹ Month Year ›` navigation arrows in its header, always visible (even on an empty month, so you can navigate away from it) instead of just a static label.
- `src/screens/ChartScreen.tsx` owns the selected `monthKey` as state (defaulting to the current month) and passes `onPreviousMonth`/`onNextMonth`/`canGoToNextMonth` down. The "next" arrow disables once you're back at the current month — no browsing into months that haven't happened yet.
- `src/utils/date.ts` gained `shiftMonthKey(monthKey, deltaMonths)`, handling year rollover in both directions (December → January, January → December).
- Arrows only, no swipe gesture — considered, but arrows are simpler, need no new dependency, and are more discoverable/accessible (screen readers, no hidden gesture to find) than swipe-only navigation would be.
- Because bottom tab screens stay mounted by default, navigating to a past month and switching to the Expenses tab and back preserves that selection — it doesn't silently reset to the current month.

### CSV Data Export (Iteration 8)
- `src/utils/csv.ts` is a pure utility that transforms a list of `Expense` records into an RFC 4180-compliant CSV string, including escaping cell values containing commas, double quotes, or newlines.
- `src/services/expenseExport.ts` converts the current expenses using the CSV utility, writes the file to the local device's cache directory via `expo-file-system/legacy`, and triggers the native OS sharing sheet using `expo-sharing`.
- `src/components/ExpenseList.tsx` renders a ListHeaderComponent for the FlatList, adding a section label ("Recent Expenses") and a touchable "Export CSV" action link.
- `src/screens/HistoryScreen.tsx` controls the `exporting` UI loading state and captures native file system or sharing failures, displaying them to the user via native `Alert` dialogs.

### Splitting Ledger and Form Screens (Iteration 9)
- `src/types/navigation.ts` holds type definitions for bottom tab routing and parameter passing.
- `src/screens/AddScreen.tsx` manages logging new expenses and editing existing ones. Tapping an expense in the ledger passes the record via navigation parameters, shifting the form into "Edit Expense" mode. Cancel/Save actions reset parameters and return the user to the ledger.
- `src/screens/HistoryScreen.tsx` presents the transaction ledger and handles navigation to edit mode.
- Tab synchronization remains decoupled; focus hooks (`useFocusEffect`) reload AsyncStorage values whenever any screen becomes active, keeping the Add, History, and Chart tabs updated automatically.

### Filter and Search in History (Iteration 10)
- `src/screens/HistoryScreen.tsx` was extended with `searchQuery` and `selectedCategory` filters, computing a memoized `filteredExpenses` list. The interface adds a search input with a clear button, and a horizontal scrollable row of category chips.
- `src/components/ExpenseList.tsx` was updated to accept `isFiltered`. If filters return zero results, it displays `"No matching expenses found."` rather than the default empty state.
- Export triggers in `HistoryScreen.tsx` pass `filteredExpenses` to the CSV generator, allowing users to export custom filtered subsets.

### 3-Month Trend Chart (Iteration 11)
- `src/services/trendSummary.ts` aggregates historical expenses over a rolling 3-month window ending in the selected month key, computing category-specific monthly totals, latest-month spending, and the percentage change compared to the prior month.
- `src/components/TrendChart.tsx` renders a visual category list where each category has a 3-month vertical column sparkline scaled relative to the global maximum spent in the period (descending opacities represent temporal distance), short history labels, and color-coded percentage change indicators (green decrease, red increase, grey neutral, blue new).
- `src/screens/ChartScreen.tsx` was refactored: pulled the month navigation arrows to the screen level (fixed at the top), added a custom segmented control toggle, and conditionally renders `MonthlyChart` or `TrendChart`.
- `src/components/MonthlyChart.tsx` was simplified to remove its internal month navigation block.

### Vercel Deployment & Web Compatibility (Iteration 12)
- Added web platform support by installing `react-native-web`, `react-dom`, and `@expo/metro-runtime`.
- Created platform-specific split date pickers: [DatePicker.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/DatePicker.tsx) for iOS/Android native `@react-native-community/datetimepicker` integrations, and [DatePicker.web.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/components/DatePicker.web.tsx) using the standard HTML5 `<input type="date">` for web compatibility.
- Integrated the Vercel builder using `vercel.json` and a package `"build"` script executing `expo export --platform web` to publish to the `dist/` directory automatically.

### Recurring Expenses (Iteration 13)
- `src/models/recurring.ts` defines scheduling intervals (`'daily' | 'weekly' | 'monthly' | 'yearly'`) and parameter sets.
- `src/services/recurringGenerator.ts` handles calculation of billing cycles, month-end caps, leap year calculations, and transaction templates.
- `src/services/recurringStorage.ts` supports templates CRUD and processes generated transactions via atomic batch multi-set updates.
- `src/hooks/useExpenses.ts` refreshes the database on focus, triggering the generator to capture outstanding scheduled items.
- `src/components/AddExpenseForm.tsx` embeds repeat options, and [AddScreen.tsx](file:///C:/Users/marve/Desktop/AI-286-Builds/Build_31/src/screens/AddScreen.tsx) displays the list of scheduled bills with cancellation controls.

### Dynamic Category Lists (Iteration 14)
- `src/services/categoryStorage.ts` seeds the default 8 categories, and supports add/rename/delete actions. It performs cascading updates to modify database category names inside expenses and templates on rename, or defaults them to `'Other'` on delete.
- `src/screens/AddScreen.tsx` incorporates a modal allowing the user to configure categories inline, choosing from a premium 12-color swatch palette with double-tap delete confirmations.
- Components read categories dynamically, decoupling color maps from static files to render views seamlessly.

### Budget Goals (Iteration 15)
- `src/services/budgetStorage.ts` provides I/O support for storing monthly category limits.
- `src/screens/AddScreen.tsx` integrates inline budget setting inputs directly within the categories configurator modal.
- `src/components/MonthlyChart.tsx` displays gridded progress bars (`$spent of $limit budget`) and warning alert labels (`⚠️ Over budget by $difference` in red) when spending overflows monthly budget goals.

### Income & Balance Tracking (Iteration 16)
- `src/models/expense.ts` declares transaction types (`'expense' | 'income'`) and validation rules.
- `src/components/AddExpenseForm.tsx` embeds dynamic Expense/Income segmented toggles that adjust submission payloads.
- `src/screens/HistoryScreen.tsx` displays a multi-column balance panel (Income, Spent, Net Balance) calculating values from active database subsets.
- `src/components/ExpenseList.tsx` highlights incoming line items in high-contrast green.
- `src/utils/csv.ts` appends a `Type` column header and mapped properties to data exports.

## Continuous integration
Every push and pull request against `main` runs typecheck and the full Jest
test suite via GitHub Actions (`.github/workflows/ci.yml`). There's no
separate "build" step: Expo managed-workflow apps don't have a plain
`npm run build` outside of EAS Build (which needs Apple/Google credentials),
so typecheck + tests are the CI-appropriate checks for this stage of the
project.

## Notes
- The chart, tab bar, date picker, and export sheet haven't been run through a simulator/device screenshot in this environment (no simulator available here) — verified via successful Android *and* iOS bundle exports (`npx expo export --platform android|ios`), TypeScript, and the test suite. The date picker in particular renders very differently per platform (inline pill on iOS, dialog on Android) — please check both if you can, or at least whichever platform you primarily use.
- Deleting an expense on the History tab and then switching to Chart shows the updated total right away — this relies on `useFocusEffect` re-loading on tab focus, not a shared store, since screens didn't yet justify adding one.
- `AGENTS.md`, `claude.md`, and `BUILD_NOTES.md` are intentionally excluded from this repo (see `.gitignore`) — they're local build-process files, not part of the shipped app.
