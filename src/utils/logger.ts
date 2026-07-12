// src/utils/logger.ts
// Minimal structured logger. Emits JSON lines with a level, scope, message,
// and timestamp instead of raw console.log strings, per project logging
// standards. This is a local-only mobile app, so logs stay in the device
// console (visible in the Expo/Metro terminal) rather than shipping anywhere.
// Connects to: src/services/expenseStorage.ts
// Created: 2026-07-12

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function emit(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    level,
    scope,
    message,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);

  if (level === 'debug') console.debug(line);
  else if (level === 'info') console.info(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
}

export const logger = {
  debug: (scope: string, message: string, meta?: Record<string, unknown>) => emit('debug', scope, message, meta),
  info: (scope: string, message: string, meta?: Record<string, unknown>) => emit('info', scope, message, meta),
  warn: (scope: string, message: string, meta?: Record<string, unknown>) => emit('warn', scope, message, meta),
  error: (scope: string, message: string, meta?: Record<string, unknown>) => emit('error', scope, message, meta),
};
