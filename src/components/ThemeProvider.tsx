// src/components/ThemeProvider.tsx
// React Context providing current theme status ('light' | 'dark' | 'oled'),
// set theme methods, and mapped color tokens. Also manages Status bar color shifts.
// Connects to: src/services/themeStorage.ts, App.tsx
// Created: 2026-07-18

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppTheme, getSavedTheme, saveTheme } from '../services/themeStorage';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  card: string;
  primary: string;
  success: string;
  error: string;
  warning: string;
  inputBg: string;
  shadow: string;
}

const LIGHT_COLORS: ThemeColors = {
  background: '#ffffff',
  surface: '#fafafa',
  surfaceSecondary: '#f2f2f2',
  border: '#f0f0f0',
  borderSecondary: '#e2e2e2',
  text: '#222222',
  textSecondary: '#666666',
  textMuted: '#999999',
  card: '#f9f9f9',
  primary: '#2f6feb',
  success: '#1baf7a',
  error: '#c0392b',
  warning: '#d68910',
  inputBg: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.05)',
};

const DARK_COLORS: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  surfaceSecondary: '#2d2d2d',
  border: '#2a2a2a',
  borderSecondary: '#3a3a3a',
  text: '#e0e0e0',
  textSecondary: '#a0a0a0',
  textMuted: '#707070',
  card: '#1a1a1a',
  primary: '#5089f0',
  success: '#2ecc71',
  error: '#e74c3c',
  warning: '#f1c40f',
  inputBg: '#1e1e1e',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const OLED_COLORS: ThemeColors = {
  background: '#000000',
  surface: '#0d0d0d',
  surfaceSecondary: '#1a1a1a',
  border: '#161616',
  borderSecondary: '#262626',
  text: '#f0f0f0',
  textSecondary: '#8a8a8a',
  textMuted: '#555555',
  card: '#080808',
  primary: '#3f7ef8',
  success: '#27ae60',
  error: '#c0392b',
  warning: '#f39c12',
  inputBg: '#0a0a0a',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

interface ThemeContextType {
  theme: AppTheme;
  colors: ThemeColors;
  changeTheme: (theme: AppTheme) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('light');

  useEffect(() => {
    async function loadTheme() {
      const saved = await getSavedTheme();
      setThemeState(saved);
    }
    loadTheme();
  }, []);

  const changeTheme = async (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    await saveTheme(nextTheme);
  };

  const isDark = theme === 'dark' || theme === 'oled';
  const colors = theme === 'light' ? LIGHT_COLORS : theme === 'dark' ? DARK_COLORS : OLED_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, colors, changeTheme, isDark }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
