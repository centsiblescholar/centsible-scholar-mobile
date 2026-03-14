import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PayPeriod, formatPayPeriodRange } from '../../utils/payPeriods';

interface PayPeriodProgressProps {
  currentPeriod: PayPeriod | null;
  totalPeriods: number;
  paidCount: number;
}

export function PayPeriodProgress({ currentPeriod, totalPeriods, paidCount }: PayPeriodProgressProps) {
  if (!currentPeriod) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={18} color="#6B7280" />
          <Text style={styles.headerText}>No Active Pay Period</Text>
        </View>
      </View>
    );
  }

  const progressPercent = currentPeriod.totalDays > 0
    ? Math.min(((currentPeriod.totalDays - currentPeriod.daysRemaining) / currentPeriod.totalDays) * 100, 100)
    : 0;

  const isEndingSoon = currentPeriod.daysRemaining <= 3 && currentPeriod.daysRemaining > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={isEndingSoon ? '#F59E0B' : '#6366F1'}
          />
          <Text style={styles.headerText}>
            Pay Period {currentPeriod.periodNumber} of {totalPeriods}
          </Text>
        </View>
        <View style={styles.paidBadge}>
          <Text style={styles.paidBadgeText}>{paidCount} paid</Text>
        </View>
      </View>

      <Text style={styles.dateRange}>{formatPayPeriodRange(currentPeriod)}</Text>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {currentPeriod.daysRemaining} day{currentPeriod.daysRemaining !== 1 ? 's' : ''} remaining
        </Text>
        {isEndingSoon && (
          <View style={styles.endingSoonBadge}>
            <Ionicons name="alert-circle" size={12} color="#F59E0B" />
            <Text style={styles.endingSoonText}>Ending Soon</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  dateRange: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  endingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  endingSoonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
  },
});
