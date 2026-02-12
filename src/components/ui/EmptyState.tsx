/**
 * EmptyState - Consistent empty state display
 *
 * Usage:
 *   <EmptyState
 *     icon="school-outline"
 *     title="No Students Yet"
 *     description="Add a student to get started"
 *     actionLabel="Add Student"
 *     onAction={() => router.push('/add-student')}
 *   />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { textStyles } from '@/theme';
import { spacing, borderRadius, sizing } from '@/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={sizing.icon2xl}
        color={colors.textTertiary}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  icon: {
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h3,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    minHeight: sizing.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...textStyles.button,
  },
});
