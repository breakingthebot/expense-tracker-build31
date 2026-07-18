// src/utils/id.ts
// Generates a locally-unique alphanumeric ID for database keys.
// Created: 2026-07-18

/** Generates a locally-unique ID using time base and random slug. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
