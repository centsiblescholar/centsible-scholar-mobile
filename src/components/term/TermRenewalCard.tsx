import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TermConfig, RenewalMode } from '../../hooks/useTermTracking';

interface TermRenewalCardProps {
  termConfig: TermConfig;
  currentTermNumber: number;
  onRenew: (termLengthWeeks: number) => void;
  onDismiss?: () => void;
  isRenewing: boolean;
}

export function TermRenewalCard({
  termConfig,
  currentTermNumber,
  onRenew,
  onDismiss,
  isRenewing,
}: TermRenewalCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="refresh-outline" size={24} color="#6366F1" />
        </View>
      </View>

      <Text style={styles.title}>Term {currentTermNumber - 1} Complete!</Text>
      <Text style={styles.subtitle}>
        Ready to start Term {currentTermNumber}? The new term will use the same{' '}
        {termConfig.term_length}-week duration.
      </Text>

      <TouchableOpacity
        style={[styles.renewButton, isRenewing && styles.disabledButton]}
        onPress={() => onRenew(termConfig.term_length)}
        disabled={isRenewing}
      >
        {isRenewing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.renewButtonText}>Start New Term</Text>
          </>
        )}
      </TouchableOpacity>

      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>Not right now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
  },
  iconRow: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  renewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    marginTop: 10,
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
