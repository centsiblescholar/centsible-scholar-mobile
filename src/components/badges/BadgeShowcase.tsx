import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../shared/types/badges';
import BadgeCard from './BadgeCard';
import { useTheme, type ThemeColors } from '@/theme';

interface BadgeShowcaseProps {
  badges: Badge[];
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'academic', label: 'Academic' },
  { id: 'behavior', label: 'Behavior' },
  { id: 'streak', label: 'Streaks' },
  { id: 'milestone', label: 'Milestones' },
] as const;

export default function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<string>('all');

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const inProgressCount = badges.filter(b => !b.unlocked && (b.progress || 0) > 0).length;
  const lockedCount = badges.filter(b => !b.unlocked && !(b.progress || 0)).length;

  const filteredBadges = activeTab === 'all'
    ? badges
    : badges.filter(b => b.category === activeTab);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="trophy" size={22} color="#D97706" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Achievement Badges</Text>
          <Text style={styles.subtitle}>{unlockedCount} of {badges.length} badges unlocked</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.statValue, { color: '#16A34A' }]}>{unlockedCount}</Text>
          <Text style={[styles.statLabel, { color: '#15803D' }]}>Unlocked</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{inProgressCount}</Text>
          <Text style={[styles.statLabel, { color: '#1D4ED8' }]}>In Progress</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundTertiary }]}>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>{lockedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Locked</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {CATEGORIES.map(cat => {
          const count = cat.id === 'all' ? badges.length : badges.filter(b => b.category === cat.id).length;
          const isActive = activeTab === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(cat.id)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Badge Grid */}
      {filteredBadges.length > 0 ? (
        <FlatList
          data={filteredBadges}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={item => item.id}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <BadgeCard badge={item} />
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="ribbon-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No badges in this category yet</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabScroll: {
    marginBottom: 14,
  },
  tabContainer: {
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
});
