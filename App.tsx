// Navigation root. Bottom tab navigator with three tabs: Add (add expense),
// History (list ledger), and Chart (monthly breakdown). Wrapped in a ThemeProvider
// to enable light, dark, and OLED black mode styling across all views and navigation bars.
// Connects to: src/screens/AddScreen.tsx, src/screens/HistoryScreen.tsx,
// src/screens/ChartScreen.tsx, src/components/ThemeProvider.tsx
// Created: 2026-07-12

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChartScreen from './src/screens/ChartScreen';
import AddScreen from './src/screens/AddScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { ThemeProvider, useTheme } from './src/components/ThemeProvider';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen name="Add" component={AddScreen} options={{ title: 'Add Expense' }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Chart" component={ChartScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
