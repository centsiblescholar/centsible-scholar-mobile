import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermRenewalBannerProps {
  studentName: string;
  termNumber: number;
  onPress: () => void;
}

export function TermRenewalBanner({ studentName, termNumber, onPress }: TermRenewalBannerProps) {
  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name="refresh-circle" size={22} color="#6366F1" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {studentName}'s term has ended
        </Text>
        <Text style={styles.subtitle}>
          Tap to review and start Term {termNumber}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6366F1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
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
    color: '#312E81',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#4338CA',
  },
});
