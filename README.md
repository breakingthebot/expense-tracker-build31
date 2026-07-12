# Expense Tracker

[![CI](https://github.com/breakingthebot/expense-tracker-build31/actions/workflows/ci.yml/badge.svg)](https://github.com/breakingthebot/expense-tracker-build31/actions/workflows/ci.yml)

A React Native (Expo) mobile app for logging expenses and browsing them, with everything stored locally on the device.

## Stack
- React Native + Expo (TypeScript, managed workflow)
- `@react-native-async-storage/async-storage` for on-device local storage
- `@react-navigation/native` + `@react-navigation/bottom-tabs` for the Expenses/Chart tab navigation
- Jest (`jest-expo` preset) for tests

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
Not deployed anywhere yet — run locally via Expo Go as described above.

## Data Handling
- All expense data (amount, category, note, date) is stored only on the device, using AsyncStorage. Nothing is sent to a server.
- No account, sign-in, or personal identifying information is collected.
- Deleting the app removes all stored expense data.

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

## Continuous integration

Every push and pull request against `main` runs typecheck and the full Jest
test suite via GitHub Actions (`.github/workflows/ci.yml`). There's no
separate "build" step: Expo managed-workflow apps don't have a plain
`npm run build` outside of EAS Build (which needs Apple/Google credentials),
so typecheck + tests are the CI-appropriate checks for this stage of the
project.

## Notes
- The date field currently defaults to today and isn't user-editable in the form; a proper date picker is a candidate for a later iteration.
- The chart is light-mode only for now; the tab bar and screens likewise haven't been run through a simulator/device screenshot in this environment (no simulator available here) — verified via a successful Android bundle export (`npx expo export --platform android`), TypeScript, and the test suite. Please eyeball it on your device the first time you pull this.
- Deleting an expense on the Expenses tab and then switching to Chart shows the updated total right away — this relies on `useFocusEffect` re-loading on tab focus, not a shared store, since two screens didn't yet justify adding one.
- `AGENTS.md`, `claude.md`, and `BUILD_NOTES.md` are intentionally excluded from this repo (see `.gitignore`) — they're local build-process files, not part of the shipped app.
