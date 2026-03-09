import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, tints } from '@/theme';
import { usePendingReviews } from '../../hooks/usePendingReviews';
import { BehaviorAssessment } from '../../shared/types';
import BehaviorReviewModal from '../behavior/BehaviorReviewModal';

export default function PendingReviewsWidget() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    pendingReviews,
    loading,
    reviewingId,
    deletingId,
    fetchPendingReviews,
    reviewAssessment,
    deleteAssessment,
  } = usePendingReviews();

  const [currentReview, setCurrentReview] = useState<BehaviorAssessment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingReviews();
    setIsRefreshing(false);
  };

  const handleReview = (assessment: BehaviorAssessment) => {
    setCurrentReview(assessment);
  };

  const handleApprove = async (notes: string) => {
    if (!currentReview) return;
    await reviewAssessment(currentReview.id, 'approve', notes);
    setCurrentReview(null);
  };

  const handleRevision = async (notes: string) => {
    if (!currentReview) return;
    await reviewAssessment(currentReview.id, 'request_revision', notes);
    setCurrentReview(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Assessment?',
      `Are you sure you want to delete the behavior assessment for ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAssessment(id),
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
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerIconBox}>
            <Ionicons name="eye-outline" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Pending Reviews</Text>
            <Text style={styles.cardSubtitle}>Loading...</Text>
          </View>
        </View>
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
      </View>
    );
  }

  // ── Empty state ──
  if (pendingReviews.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.headerIconBox, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Pending Reviews</Text>
            <Text style={styles.cardSubtitle}>Items need your attention</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Ionicons
              name="refresh"
              size={18}
              color={colors.textTertiary}
              style={isRefreshing ? { opacity: 0.4 } : undefined}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyBody}>
          <Ionicons name="checkmark-circle" size={40} color="#10B981" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No behavior assessments pending review.</Text>
        </View>
      </View>
    );
  }

  // ── With reviews ──
  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerIconBox}>
            <Ionicons name="eye-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Pending Reviews</Text>
            <Text style={styles.cardSubtitle}>Items need your attention</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pendingReviews.length}</Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Ionicons name="refresh" size={18} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Review items */}
        {pendingReviews.map((review) => {
          const studentName = review.user
            ? `${review.user.first_name} ${review.user.last_name}`.trim()
            : 'Student';
          const initials = review.user
            ? `${review.user.first_name?.[0] || ''}${review.user.last_name?.[0] || ''}`
            : 'S';
          const disputeCount =
            review.score_disputes ? Object.keys(review.score_disputes).length : 0;

          return (
            <TouchableOpacity
              key={review.id}
              style={styles.reviewRow}
              onPress={() => handleReview(review)}
              activeOpacity={0.7}
            >
              <View style={styles.reviewRowLeft}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{initials}</Text>
                </View>
                <View style={styles.reviewInfo}>
                  <View style={styles.reviewNameRow}>
                    <Text style={styles.reviewName} numberOfLines={1}>
                      {studentName}
                    </Text>
                    {review.originated_by === 'parent' && (
                      <View style={styles.originBadge}>
                        <Text style={styles.originBadgeText}>Parent</Text>
                      </View>
                    )}
                    {disputeCount > 0 && (
                      <View style={styles.disputeCountBadge}>
                        <Text style={styles.disputeCountText}>{disputeCount} Disputed</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.submitted_at || review.date)}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(review.id, studentName)}
                  disabled={deletingId === review.id}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  {deletingId === review.id ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  )}
                </TouchableOpacity>
                <View style={styles.reviewBtnBox}>
                  <Text style={styles.reviewBtnText}>Review</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Footer */}
        <View style={styles.footerBar}>
          <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
          <Text style={styles.footerText}>
            {pendingReviews.length} assessment{pendingReviews.length !== 1 ? 's' : ''} waiting
          </Text>
        </View>
      </View>

      {/* Review Modal */}
      <BehaviorReviewModal
        visible={!!currentReview}
        assessment={currentReview}
        onClose={() => setCurrentReview(null)}
        onApprove={handleApprove}
        onRequestRevision={handleRevision}
        isLoading={reviewingId === currentReview?.id}
      />
    </>
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
      overflow: 'hidden',
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

    // Review Row
    reviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.backgroundSecondary,
    },
    reviewRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    reviewAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#E0E7FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    reviewAvatarText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
    reviewInfo: { flex: 1 },
    reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    reviewName: { fontSize: 14, fontWeight: '600', color: colors.text, maxWidth: 120 },
    originBadge: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    originBadgeText: { fontSize: 9, fontWeight: '600', color: colors.textSecondary },
    disputeCountBadge: {
      backgroundColor: '#FEE2E2',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    disputeCountText: { fontSize: 9, fontWeight: '600', color: '#EF4444' },
    reviewDate: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },

    // Actions
    reviewActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deleteBtn: { padding: 6 },
    reviewBtnBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 2,
    },
    reviewBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },

    // Footer
    footerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.backgroundSecondary,
      gap: 6,
    },
    footerText: { fontSize: 11, color: '#D97706' },
  });
