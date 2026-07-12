// App.tsx
// Navigation root. Bottom tab navigator with two tabs: Expenses (add +
// list) and Chart (monthly breakdown). Each screen owns its own data
// loading via useExpenses(), refreshed on focus.
// Connects to: src/screens/ExpensesScreen.tsx, src/screens/ChartScreen.tsx
// Created: 2026-07-12

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChartScreen from './src/screens/ChartScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2f6feb',
          }}
        >
          <Tab.Screen name="Expenses" component={ExpensesScreen} />
          <Tab.Screen name="Chart" component={ChartScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
