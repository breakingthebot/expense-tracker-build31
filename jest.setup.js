// jest.setup.js
// Registers the AsyncStorage jest mock so tests never touch real device
// storage. Loaded via the "setupFiles" entry in package.json's jest config.
// Connects to: tests/services/expenseStorage.test.ts
// Created: 2026-07-12

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
