import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PayPeriod } from '../../utils/payPeriods';

interface PayPeriodEndingBannerProps {
  period: PayPeriod;
}

export function PayPeriodEndingBanner({ period }: PayPeriodEndingBannerProps) {
  if (!period.isActive || period.daysRemaining > 3) return null;

  const urgencyText =
    period.daysRemaining === 0
      ? 'Pay period ends today!'
      : period.daysRemaining === 1
        ? 'Pay period ends tomorrow!'
        : `Pay period ends in ${period.daysRemaining} days`;

  return (
    <View style={styles.banner}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={20} color="#F59E0B" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{urgencyText}</Text>
        <Text style={styles.subtitle}>
          Make sure all your grades are up to date before your paycheck is calculated.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconContainer: {
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
});
