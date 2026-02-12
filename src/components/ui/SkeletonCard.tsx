/**
 * Skeleton loading components for consistent loading states
 *
 * Usage:
 *   <SkeletonCard />                    // Single card skeleton
 *   <SkeletonCard height={80} lines={2} /> // Card with text lines
 *   <SkeletonList count={5} />          // List of skeleton cards
 *   <DashboardSkeleton />              // Dashboard-specific skeleton
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useTheme } from '@/theme';
import { spacing, borderRadius } from '@/theme';

interface SkeletonCardProps {
  height?: number;
  width?: number | string;
  radius?: number;
  lines?: number;
}

export function SkeletonCard({
  height = 120,
  width = '100%',
  radius = borderRadius.lg,
  lines,
}: SkeletonCardProps) {
  const { isDark } = useTheme();
  const colorMode = isDark ? 'dark' : 'light';

  return (
    <Skeleton.Group show>
      <View style={styles.cardContainer}>
        <Skeleton
          colorMode={colorMode}
          height={height}
          width={width as number}
          radius={radius}
        />
        {lines !== undefined &&
          Array.from({ length: lines }).map((_, i) => (
            <View key={i} style={styles.lineSpacing}>
              <Skeleton
                colorMode={colorMode}
                height={14}
                width={i === lines - 1 ? '60%' : '90%'}
                radius={borderRadius.sm}
              />
            </View>
          ))}
      </View>
    </Skeleton.Group>
  );
}

interface SkeletonListProps {
  count?: number;
  cardHeight?: number;
}

export function SkeletonList({ count = 3, cardHeight = 120 }: SkeletonListProps) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  const { isDark } = useTheme();
  const colorMode = isDark ? 'dark' : 'light';

  return (
    <Skeleton.Group show>
      <View style={styles.dashboardContainer}>
        {/* Hero card */}
        <Skeleton
          colorMode={colorMode}
          height={120}
          width="100%"
          radius={borderRadius.lg}
        />

        {/* Metric cards row */}
        <View style={styles.metricsRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.metricCard}>
              <Skeleton
                colorMode={colorMode}
                height={72}
                width="100%"
                radius={borderRadius.md}
              />
            </View>
          ))}
        </View>

        {/* Section skeletons */}
        <Skeleton
          colorMode={colorMode}
          height={160}
          width="100%"
          radius={borderRadius.lg}
        />
        <View style={styles.sectionSpacing}>
          <Skeleton
            colorMode={colorMode}
            height={160}
            width="100%"
            radius={borderRadius.lg}
          />
        </View>
      </View>
    </Skeleton.Group>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    overflow: 'hidden',
  },
  lineSpacing: {
    marginTop: spacing[2],
  },
  listContainer: {
    gap: spacing[3],
  },
  dashboardContainer: {
    gap: spacing[4],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  metricCard: {
    flex: 1,
  },
  sectionSpacing: {
    marginTop: spacing[0],
  },
});
