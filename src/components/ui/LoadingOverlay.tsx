/**
 * LoadingOverlay - Modal progress overlay for long-running operations
 *
 * Usage:
 *   // Spinner mode
 *   <LoadingOverlay visible={isExporting} message="Exporting data..." />
 *
 *   // Progress bar mode
 *   <LoadingOverlay visible={isExporting} message="Exporting..." progress={65} />
 */

import React from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { textStyles } from '@/theme';
import { spacing, borderRadius, shadows, sizing } from '@/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
}

export function LoadingOverlay({ visible, message, progress }: LoadingOverlayProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }, shadows.xl]}>
          {progress !== undefined ? (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(Math.max(progress, 0), 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: sizing.progressHeight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...textStyles.bodySmall,
    marginTop: spacing[2],
  },
  message: {
    ...textStyles.body,
    textAlign: 'center',
    marginTop: spacing[4],
  },
});
