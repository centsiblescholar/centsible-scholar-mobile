import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, tints } from '@/theme';
import { BehaviorAssessment } from '../../shared/types';

// ────────────────────────────────────────────────────────
// Types & Constants
// ────────────────────────────────────────────────────────

interface BehaviorReviewModalProps {
  visible: boolean;
  assessment: BehaviorAssessment | null;
  onClose: () => void;
  onApprove: (notes: string) => void;
  onRequestRevision: (notes: string) => void;
  isLoading: boolean;
}

const SCORE_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Poor', color: '#EF4444', bg: '#FEE2E2' },
  2: { label: 'Below Avg', color: '#F97316', bg: '#FFEDD5' },
  3: { label: 'Average', color: '#F59E0B', bg: '#FEF3C7' },
  4: { label: 'Good', color: '#3B82F6', bg: '#DBEAFE' },
  5: { label: 'Excellent', color: '#10B981', bg: '#D1FAE5' },
};

const OBLIGATIONS = [
  { key: 'diet', label: 'Diet' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'work', label: 'Work' },
  { key: 'hygiene', label: 'Hygiene' },
] as const;

const OPPORTUNITIES = [
  { key: 'respect', label: 'Respect' },
  { key: 'responsibilities', label: 'Responsibilities' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'cooperation', label: 'Cooperation' },
  { key: 'courtesy', label: 'Courtesy' },
  { key: 'service', label: 'Service' },
] as const;

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

export default function BehaviorReviewModal({
  visible,
  assessment,
  onClose,
  onApprove,
  onRequestRevision,
  isLoading,
}: BehaviorReviewModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [notes, setNotes] = useState('');
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  if (!assessment) return null;

  const studentName = assessment.user
    ? `${assessment.user.first_name} ${assessment.user.last_name}`.trim()
    : 'Student';

  const initials = assessment.user
    ? `${assessment.user.first_name?.[0] || ''}${assessment.user.last_name?.[0] || ''}`
    : 'S';

  const hasDisputes = assessment.score_disputes && Object.keys(assessment.score_disputes).length > 0;
  const disputeCount = hasDisputes ? Object.keys(assessment.score_disputes!).length : 0;

  const getScore = (key: string): number => {
    const val = (assessment as unknown as Record<string, unknown>)[key];
    return typeof val === 'number' ? val : 3;
  };

  const isDisputed = (key: string): boolean =>
    assessment.score_disputes?.[key] !== undefined;

  const getDisputeComment = (key: string): string | undefined => {
    const d = assessment.score_disputes?.[key];
    return d && typeof d === 'object' && 'comment' in d ? (d as { comment?: string }).comment : undefined;
  };

  const toggleFlag = (key: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApprove = () => {
    onApprove(notes);
    setNotes('');
    setFlagged(new Set());
  };

  const handleRevision = () => {
    let finalNotes = notes;
    if (flagged.size > 0) {
      const labels = [...flagged].map((k) => {
        const o = OBLIGATIONS.find((x) => x.key === k);
        const p = OPPORTUNITIES.find((x) => x.key === k);
        return o?.label || p?.label || k;
      });
      const prefix = `Categories needing revision: ${labels.join(', ')}`;
      finalNotes = notes ? `${prefix}\n\n${notes}` : prefix;
    }
    onRequestRevision(finalNotes);
    setNotes('');
    setFlagged(new Set());
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // ── Score Card ──
  const ScoreCard = ({ categoryKey, label }: { categoryKey: string; label: string }) => {
    const score = getScore(categoryKey);
    const disputed = isDisputed(categoryKey);
    const disputeComment = getDisputeComment(categoryKey);
    const config = SCORE_CONFIG[score] || SCORE_CONFIG[3];
    const isFlagged = flagged.has(categoryKey);

    return (
      <TouchableOpacity
        style={[
          styles.scoreCard,
          isFlagged && styles.scoreCardFlagged,
          disputed && !isFlagged && styles.scoreCardDisputed,
        ]}
        onPress={() => toggleFlag(categoryKey)}
        activeOpacity={0.7}
      >
        {/* Flag / dispute badge */}
        {isFlagged && (
          <View style={styles.flagBadge}>
            <Ionicons name="close" size={10} color="#fff" />
          </View>
        )}
        {disputed && !isFlagged && (
          <View style={styles.disputeBadge}>
            <Text style={styles.disputeBadgeText}>!</Text>
          </View>
        )}

        <View style={styles.scoreCardHeader}>
          <Text style={styles.scoreCardLabel}>{label.toUpperCase()}</Text>
          {!isFlagged && <Text style={styles.tapHint}>Tap to flag</Text>}
        </View>

        <View style={styles.scoreCardRow}>
          <View style={[styles.scorePill, { backgroundColor: isFlagged ? '#FEE2E2' : config.bg }]}>
            <Text style={[styles.scorePillText, { color: isFlagged ? '#EF4444' : config.color }]}>
              {score}/5
            </Text>
          </View>
          <Text style={styles.scoreRatingText}>{config.label}</Text>
        </View>

        {disputed && disputeComment && (
          <View style={styles.disputeCommentBox}>
            <Text style={styles.disputeCommentText}>"{disputeComment}"</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Section renderer ──
  const renderSection = (
    title: string,
    subtitle: string,
    dotColor: string,
    items: ReadonlyArray<{ key: string; label: string }>,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.scoreGrid}>
        {items.map(({ key, label }) => (
          <ScoreCard key={key} categoryKey={key} label={label} />
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Review — {studentName}
              </Text>
              <View style={styles.headerMeta}>
                <Text style={styles.headerMetaText}>{formatDate(assessment.date)}</Text>
                {assessment.originated_by && (
                  <>
                    <Text style={styles.headerDot}>·</Text>
                    <Text style={styles.headerMetaText}>
                      By {assessment.originated_by === 'parent' ? 'Parent' : 'Student'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable Content ── */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {/* Dispute Banner */}
          {hasDisputes && (
            <View style={styles.disputeBanner}>
              <Ionicons name="alert-circle" size={20} color="#D97706" />
              <View style={styles.disputeBannerText}>
                <Text style={styles.disputeBannerTitle}>
                  Student Disputed {disputeCount} Score{disputeCount !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.disputeBannerSub}>
                  Review highlighted categories below before deciding.
                </Text>
              </View>
            </View>
          )}

          {renderSection('Obligations', '(Required)', '#3B82F6', OBLIGATIONS as unknown as Array<{ key: string; label: string }>)}
          {renderSection('Opportunities', '(Bonus)', '#8B5CF6', OPPORTUNITIES as unknown as Array<{ key: string; label: string }>)}

          {/* Flagged summary */}
          {flagged.size > 0 && (
            <View style={styles.flagSummary}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.flagSummaryText}>
                {flagged.size} categor{flagged.size === 1 ? 'y' : 'ies'} flagged for revision
              </Text>
            </View>
          )}

          {/* Parent Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Parent Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add feedback for your student..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
          </View>
        </ScrollView>

        {/* ── Footer Actions ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.revisionButton,
              flagged.size > 0 && styles.revisionButtonFlagged,
            ]}
            onPress={handleRevision}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={18} color={flagged.size > 0 ? '#EF4444' : '#D97706'} />
                <Text style={[styles.revisionButtonText, flagged.size > 0 && { color: '#EF4444' }]}>
                  Revision{flagged.size > 0 ? ` (${flagged.size})` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#6366F1',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    headerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    headerMetaText: { fontSize: 12, color: colors.textSecondary },
    headerDot: { fontSize: 12, color: colors.textTertiary, marginHorizontal: 4 },
    closeButton: { padding: 4 },

    // Body
    body: { flex: 1 },
    bodyContent: { padding: 16, paddingBottom: 32 },

    // Dispute Banner
    disputeBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 14,
      backgroundColor: '#FFFBEB',
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
      borderRadius: 8,
      marginBottom: 20,
      gap: 10,
    },
    disputeBannerText: { flex: 1 },
    disputeBannerTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
    disputeBannerSub: { fontSize: 12, color: '#A16207', marginTop: 2 },

    // Section
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
    sectionDot: { width: 6, height: 6, borderRadius: 3 },
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: colors.text },
    sectionSubtitle: { fontSize: 12, color: colors.textTertiary },

    // Score Grid
    scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

    // Score Card
    scoreCard: {
      width: '47.5%',
      padding: 12,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    scoreCardFlagged: {
      borderColor: '#EF4444',
      backgroundColor: '#FEF2F2',
    },
    scoreCardDisputed: {
      borderColor: '#F59E0B',
      backgroundColor: '#FFFBEB',
    },
    flagBadge: {
      position: 'absolute',
      top: -6,
      left: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
    disputeBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#F59E0B',
      alignItems: 'center',
      justifyContent: 'center',
    },
    disputeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    scoreCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    scoreCardLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5 },
    tapHint: { fontSize: 9, color: colors.textTertiary },
    scoreCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scorePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    scorePillText: { fontSize: 14, fontWeight: '700' },
    scoreRatingText: { fontSize: 12, color: colors.textSecondary },
    disputeCommentBox: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#FDE68A',
    },
    disputeCommentText: { fontSize: 11, fontStyle: 'italic', color: '#92400E' },

    // Flag Summary
    flagSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#FEF2F2',
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
      borderRadius: 8,
      marginBottom: 20,
      gap: 8,
    },
    flagSummaryText: { fontSize: 13, fontWeight: '600', color: '#991B1B' },

    // Notes
    notesSection: { marginBottom: 16 },
    notesLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.input,
      minHeight: 88,
    },
    charCount: { fontSize: 11, color: colors.textTertiary, textAlign: 'right', marginTop: 4 },

    // Footer
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      gap: 10,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 10,
      gap: 6,
      minHeight: 48,
    },
    revisionButton: {
      backgroundColor: '#FFFBEB',
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    revisionButtonFlagged: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    revisionButtonText: { fontSize: 14, fontWeight: '600', color: '#D97706' },
    approveButton: { backgroundColor: '#16A34A' },
    approveButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  });
