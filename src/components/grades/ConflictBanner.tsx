import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';

interface ConflictBannerProps {
  conflictCount: number;
  onPress: () => void;
}

export default function ConflictBanner({ conflictCount, onPress }: ConflictBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (conflictCount === 0) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="warning" size={20} color="#92400E" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Grade Conflicts Detected</Text>
        <Text style={styles.subtitle}>
          {conflictCount} subject{conflictCount !== 1 ? 's' : ''} with mismatched grades
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#92400E" />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  subtitle: {
    fontSize: 12,
    color: '#A16207',
    marginTop: 2,
  },
});
