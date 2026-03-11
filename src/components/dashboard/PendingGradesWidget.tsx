import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, grades as gradeColors, shadows } from '@/theme';
import { useGradeApproval, type PendingGrade } from '../../hooks/useGradeApproval';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getGradeColor = (grade: string): string => {
  return (gradeColors as Record<string, string>)[grade] || '#9CA3AF';
};

export default function PendingGradesWidget() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    pendingGrades,
    pendingLoading,
    approveGrade,
    rejectGrade,
    bulkApproveGrades,
    isApproving,
    isRejecting,
    isBulkApproving,
    refetch,
  } = useGradeApproval();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionGradeId, setActionGradeId] = useState<string | null>(null);

  // Auto-expand when items arrive, auto-collapse when cleared
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(pendingGrades.length === 0);
  }, [pendingGrades.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed((prev) => !prev);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleApprove = async (grade: PendingGrade) => {
    setActionGradeId(grade.id);
    try {
      await approveGrade(grade.id);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to approve grade');
    }
    setActionGradeId(null);
  };

  const handleReject = (grade: PendingGrade) => {
    Alert.prompt
      ? Alert.prompt(
          'Reject Grade',
          `Reject ${grade.student_display_name}'s ${grade.subject} (${grade.grade})? Add optional notes:`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reject',
              style: 'destructive',
              onPress: async (notes?: string) => {
                setActionGradeId(grade.id);
                try {
                  await rejectGrade(grade.id, notes || undefined);
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to reject grade');
                }
                setActionGradeId(null);
              },
            },
          ],
          'plain-text',
          '',
        )
      : // Fallback for Android (no Alert.prompt)
        Alert.alert(
          'Reject Grade',
          `Reject ${grade.student_display_name}'s ${grade.subject} (${grade.grade})?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reject',
              style: 'destructive',
              onPress: async () => {
                setActionGradeId(grade.id);
                try {
                  await rejectGrade(grade.id);
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to reject grade');
                }
                setActionGradeId(null);
              },
            },
          ],
        );
  };

  const handleBulkApprove = () => {
    const ids = pendingGrades.map((g) => g.id);
    Alert.alert(
      'Approve All Grades',
      `Approve all ${ids.length} pending grade${ids.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              await bulkApproveGrades(ids);
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Some grades failed to approve');
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // ── Loading skeleton ──
  if (pendingLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerIconBox}>
            <Ionicons name="create-outline" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Pending Grades</Text>
            <Text style={styles.cardSubtitle}>Loading...</Text>
          </View>
        </View>
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
      </View>
    );
  }

  const isEmpty = pendingGrades.length === 0;

  // ── Card (empty or with items, both collapsible) ──
  return (
    <View style={[styles.card, isEmpty && styles.cardEmpty]}>
      {/* Tappable header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={toggleCollapse}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.headerIconBox,
            isEmpty && { backgroundColor: '#10B981' },
          ]}
        >
          <Ionicons
            name={isEmpty ? 'checkmark-circle-outline' : 'create-outline'}
            size={18}
            color="#fff"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Pending Grades</Text>
          <Text style={styles.cardSubtitle}>
            {isEmpty
              ? 'All caught up!'
              : `${pendingGrades.length} grade${pendingGrades.length !== 1 ? 's' : ''} need attention`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!isEmpty && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pendingGrades.length}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <Ionicons name="refresh" size={18} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
            size={16}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Collapsible body */}
      {!isCollapsed && (
        <>
          {isEmpty ? (
            <View style={styles.emptyBody}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                No grades pending approval.
              </Text>
            </View>
          ) : (
            <>
              {/* Grade rows */}
              {pendingGrades.map((grade) => {
                const initials = grade.student_display_name
                  .split(' ')
                  .map((w) => w[0] || '')
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                const gc = getGradeColor(grade.grade);
                const isActioning = actionGradeId === grade.id;

                return (
                  <View key={grade.id} style={styles.gradeRow}>
                    <View style={styles.gradeRowLeft}>
                      <View style={styles.gradeAvatar}>
                        <Text style={styles.gradeAvatarText}>{initials}</Text>
                      </View>
                      <View style={styles.gradeInfo}>
                        <View style={styles.gradeNameRow}>
                          <Text style={styles.gradeName} numberOfLines={1}>
                            {grade.student_display_name}
                          </Text>
                          {grade.originated_by === 'parent' && (
                            <View style={styles.originBadge}>
                              <Text style={styles.originBadgeText}>Parent</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.gradeSubject} numberOfLines={1}>
                          {grade.subject}
                        </Text>
                        <Text style={styles.gradeDate}>
                          {formatDate(grade.submitted_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.gradeRowRight}>
                      {/* Grade letter badge */}
                      <View style={[styles.gradeBadge, { backgroundColor: gc }]}>
                        <Text style={styles.gradeLetter}>{grade.grade}</Text>
                      </View>

                      {isActioning ? (
                        <ActivityIndicator size="small" color={colors.textTertiary} />
                      ) : (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleApprove(grade)}
                            disabled={isApproving || isRejecting}
                            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                          >
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleReject(grade)}
                            disabled={isApproving || isRejecting}
                            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                          >
                            <Ionicons name="close" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Footer */}
              <View style={styles.footerBar}>
                <View style={styles.footerLeft}>
                  <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
                  <Text style={styles.footerText}>
                    {pendingGrades.length} grade{pendingGrades.length !== 1 ? 's' : ''} waiting
                  </Text>
                </View>
                {pendingGrades.length > 1 && (
                  <TouchableOpacity
                    style={styles.bulkApproveBtn}
                    onPress={handleBulkApprove}
                    disabled={isBulkApproving}
                  >
                    {isBulkApproving ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={14} color="#10B981" />
                        <Text style={styles.bulkApproveText}>Approve All</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#FDE68A',
      ...shadows.md,
      overflow: 'hidden',
    },
    cardEmpty: {
      borderColor: colors.backgroundSecondary,
    },

    // Header
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 10,
    },
    headerIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: '#F59E0B',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    cardSubtitle: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    countBadge: {
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#FDE68A',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    countBadgeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

    // Skeleton
    skeletonRow: {
      height: 56,
      marginHorizontal: 14,
      marginBottom: 10,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },

    // Empty
    emptyBody: { alignItems: 'center', paddingVertical: 28, gap: 6 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    emptyText: { fontSize: 13, color: colors.textSecondary },

    // Grade Row
    gradeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.backgroundSecondary,
    },
    gradeRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    gradeAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#E0E7FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    gradeAvatarText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
    gradeInfo: { flex: 1 },
    gradeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    gradeName: { fontSize: 14, fontWeight: '600', color: colors.text, maxWidth: 120 },
    originBadge: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    originBadgeText: { fontSize: 9, fontWeight: '600', color: colors.textSecondary },
    gradeSubject: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 1 },
    gradeDate: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },

    // Right side: grade badge + actions
    gradeRowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    gradeBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradeLetter: { fontSize: 13, fontWeight: '800', color: '#fff' },

    // Action buttons
    actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    approveBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#D1FAE5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rejectBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Footer
    footerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.backgroundSecondary,
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 11, color: '#D97706' },
    bulkApproveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    bulkApproveText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  });
