import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../shared/types/badges';
import { useTheme, type ThemeColors } from '@/theme';

interface BadgeCardProps {
  badge: Badge;
  showProgress?: boolean;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  trophy: 'trophy',
  ribbon: 'ribbon',
  medal: 'medal',
  star: 'star',
  flame: 'flame',
  'shield-checkmark': 'shield-checkmark',
  cash: 'cash',
  diamond: 'diamond',
};

const RARITY_COLORS = {
  common: { bg: '#9CA3AF', light: '#F3F4F6' },
  rare: { bg: '#3B82F6', light: '#DBEAFE' },
  epic: { bg: '#8B5CF6', light: '#EDE9FE' },
  legendary: { bg: '#F59E0B', light: '#FEF3C7' },
} as const;

export default function BadgeCard({ badge, showProgress = true }: BadgeCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconName = ICON_MAP[badge.icon] || 'ribbon';
  const rarity = RARITY_COLORS[badge.rarity];
  const progressPercent = badge.maxProgress && badge.progress != null
    ? (badge.progress / badge.maxProgress) * 100
    : 0;

  const formatProgress = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return 0;
    return Number(value.toFixed(2));
  };

  return (
    <View style={[styles.card, badge.unlocked && { borderColor: '#FBBF24', borderWidth: 2 }]}>
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: badge.unlocked ? rarity.bg : '#E5E7EB' }]}>
        <Ionicons
          name={iconName}
          size={28}
          color={badge.unlocked ? '#fff' : '#9CA3AF'}
        />
        {badge.unlocked && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color="#92400E" />
          </View>
        )}
      </View>

      {/* Name & Description */}
      <Text style={[styles.name, !badge.unlocked && styles.nameDisabled]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={[styles.description, !badge.unlocked && styles.descriptionDisabled]} numberOfLines={2}>
        {badge.description}
      </Text>

      {/* Rarity Badge */}
      <View style={[styles.rarityBadge, { backgroundColor: rarity.light }]}>
        <Text style={[styles.rarityText, { color: rarity.bg }]}>
          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
        </Text>
      </View>

      {/* Progress bar (for locked badges) */}
      {!badge.unlocked && showProgress && badge.progress != null && badge.maxProgress != null && badge.maxProgress > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>
              {formatProgress(badge.progress)}/{formatProgress(badge.maxProgress)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: rarity.bg }]} />
          </View>
        </View>
      )}

      {/* Unlocked date */}
      {badge.unlocked && badge.unlockedAt && (
        <Text style={styles.unlockedDate}>
          Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 190,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  nameDisabled: {
    color: colors.textTertiary,
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
    marginBottom: 6,
  },
  descriptionDisabled: {
    color: colors.textTertiary,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressSection: {
    width: '100%',
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  progressValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  unlockedDate: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
});
