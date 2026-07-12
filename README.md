# Expense Tracker

[![CI](https://github.com/breakingthebot/expense-tracker-build31/actions/workflows/ci.yml/badge.svg)](https://github.com/breakingthebot/expense-tracker-build31/actions/workflows/ci.yml)

A React Native (Expo) mobile app for logging expenses and browsing them, with everything stored locally on the device.

## Stack
- React Native + Expo (TypeScript, managed workflow)
- `@react-native-async-storage/async-storage` for on-device local storage
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
This iteration builds the core vertical slice: add an expense and see it in a list, backed by local storage. Everything lives on one screen (no navigation library yet) to keep the first iteration small and testable.

- `src/models/expense.ts` defines the `Expense` shape and validates new expense input (positive amount, known category, valid date, note length) before anything is saved.
- `src/config/categories.ts` holds the fixed list of categories, kept separate from the model so the UI and the model both reference a single source of truth.
- `src/services/expenseStorage.ts` is the only module that talks to AsyncStorage. It reads/writes a single JSON array under one storage key, and is the boundary where validation errors and storage errors turn into user-facing messages.
- `src/components/AddExpenseForm.tsx` and `src/components/ExpenseList.tsx` are presentational — they don't know about AsyncStorage directly, only about the callbacks and data `App.tsx` passes them.
- `App.tsx` owns the loading/error/list state and wires the form and list to the storage service.
- Money is stored as integer cents (`amountCents`), not floating-point dollars, so future totals (like the monthly chart) sum exactly instead of accumulating rounding errors.

## Continuous integration

Every push and pull request against `main` runs typecheck and the full Jest
test suite via GitHub Actions (`.github/workflows/ci.yml`). There's no
separate "build" step: Expo managed-workflow apps don't have a plain
`npm run build` outside of EAS Build (which needs Apple/Google credentials),
so typecheck + tests are the CI-appropriate checks for this stage of the
project.

## Notes
- No navigation yet — this is intentionally a single-screen app for iteration 1. A tab/stack navigator is a likely next iteration once there's a second screen (e.g. the monthly chart) to navigate to.
- The date field currently defaults to today and isn't user-editable in the form; a proper date picker is a candidate for a later iteration.
- `AGENTS.md`, `claude.md`, and `BUILD_NOTES.md` are intentionally excluded from this repo (see `.gitignore`) — they're local build-process files, not part of the shipped app.
