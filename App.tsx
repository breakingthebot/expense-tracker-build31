// Navigation root. Bottom tab navigator with three tabs: Add (add expense),
// History (list ledger), and Chart (monthly breakdown). Each screen owns
// its own data loading via useExpenses(), refreshed on focus.
// Connects to: src/screens/AddScreen.tsx, src/screens/HistoryScreen.tsx, src/screens/ChartScreen.tsx
// Created: 2026-07-12

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChartScreen from './src/screens/ChartScreen';
import AddScreen from './src/screens/AddScreen';
import HistoryScreen from './src/screens/HistoryScreen';

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
          <Tab.Screen name="Add" component={AddScreen} options={{ title: 'Add Expense' }} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Chart" component={ChartScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
