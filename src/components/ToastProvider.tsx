// src/components/ToastProvider.tsx
// Provides a premium global toast alert wrapper. Animates slide-in alerts from the top
// and dispatches standard browser/OS push alerts when granted permission.
// Connects to: src/components/ThemeProvider.tsx
// Created: 2026-07-18

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ToastContextType {
  showToast: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [visible, setVisible] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Animation values
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Request browser notification permissions on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  function showToast(title: string, message: string) {
    setToastTitle(title);
    setToastMessage(message);
    setVisible(true);

    // 1. Trigger Native browser notification if supported and granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch (err) {
        // Fallback for some browsers
      }
    }

    // 2. Animate in-app Toast banner
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 20,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // Dismiss Toast helper
  function dismissToast() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }

  // Auto dismiss toast after 4 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {visible && (
        <SafeAreaView style={styles.toastWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.toastContainer,
              {
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.titleText}>{toastTitle}</Text>
              <Text style={styles.messageText}>{toastMessage}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismissToast}
              accessibilityRole="button"
              accessibilityLabel="Dismiss budget alert"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    toastWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    toastContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)',
      borderWidth: 1,
      borderColor: colors.borderSecondary,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: '100%',
      maxWidth: 420,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    iconContainer: {
      marginRight: 12,
      justifyContent: 'center',
    },
    warningIcon: {
      fontSize: 22,
    },
    textContainer: {
      flex: 1,
    },
    titleText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    messageText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    closeButton: {
      padding: 6,
      marginLeft: 8,
    },
    closeButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
