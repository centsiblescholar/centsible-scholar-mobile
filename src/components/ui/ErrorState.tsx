/**
 * ErrorState - Inline error display with retry button
 *
 * Usage:
 *   <ErrorState
 *     message="Failed to load grades"
 *     onRetry={() => refetch()}
 *   />
 *
 * Designed to be placed inline where content would normally render,
 * not as a full-screen overlay.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { textStyles } from '@/theme';
import { spacing, borderRadius, sizing } from '@/theme';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons
        name="alert-circle"
        size={sizing.iconXl}
        color={colors.error}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing[6],
  },
  icon: {
    marginBottom: spacing[3],
  },
  message: {
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  button: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    minHeight: sizing.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...textStyles.button,
  },
});
