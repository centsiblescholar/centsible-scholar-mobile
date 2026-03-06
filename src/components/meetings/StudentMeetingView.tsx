import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ChildEvaluationForm } from './ChildEvaluationForm';
import {
  MEETING_STEPS,
  TOTAL_STEPS,
  EvaluationInput,
  ChildEvaluation,
  getMeetingStatus,
  FamilyMeeting,
  calculateScorePercentage,
  getScoreLabel,
  MAX_TOTAL_SCORE,
} from '../../types/family-meeting';

interface Props {
  meeting: FamilyMeeting | null;
  evaluations: ChildEvaluation[];
  isLoading: boolean;
  onSubmitEvaluation: (meetingId: string, studentUserId: string, input: EvaluationInput) => Promise<any>;
  isSubmittingEvaluation: boolean;
  onRefresh: () => Promise<void>;
}

export function StudentMeetingView({
  meeting,
  evaluations,
  isLoading,
  onSubmitEvaluation,
  isSubmittingEvaluation,
  onRefresh,
}: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(colors);

  const myEvaluation = evaluations.find((e) => e.student_user_id === user?.id);
  const hasEvaluated = !!myEvaluation;
  const meetingStatus = meeting ? getMeetingStatus(meeting) : 'not_started';
  const isInProgress = meetingStatus === 'in_progress';
  const isCompleted = meetingStatus === 'completed';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleSubmitEvaluation = useCallback(
    async (input: EvaluationInput) => {
      if (!meeting || !user) return;
      try {
        await onSubmitEvaluation(meeting.id, user.id, input);
        setShowEvaluation(false);
        Alert.alert('Thank you!', 'Your evaluation has been submitted.');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to submit evaluation');
      }
    },
    [meeting, user, onSubmitEvaluation]
  );

  // ─── Show Evaluation Form ──────────────────────────────────
  if (showEvaluation && meeting) {
    return (
      <ScrollView style={styles.container}>
        <ChildEvaluationForm
          studentName="Your"
          onSubmit={handleSubmitEvaluation}
          onCancel={() => setShowEvaluation(false)}
          isSubmitting={isSubmittingEvaluation}
        />
      </ScrollView>
    );
  }

  // ─── No Meeting Yet ────────────────────────────────────────
  if (!meeting) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={56} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Family Meeting</Text>
            <Text style={styles.emptySubtitle}>
              Your parent hasn't started a family meeting yet. Check back later!
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.content}>
        {/* Meeting Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={isInProgress ? 'play-circle' : isCompleted ? 'checkmark-circle' : 'time'}
              size={40}
              color={isInProgress ? colors.primary : isCompleted ? colors.success : colors.textTertiary}
            />
          </View>
          <Text style={styles.statusTitle}>
            {isInProgress
              ? 'Meeting In Progress'
              : isCompleted
                ? 'Meeting Complete'
                : 'Meeting Scheduled'}
          </Text>

          {isInProgress && meeting.current_step < TOTAL_STEPS && (
            <View style={styles.currentStepBadge}>
              <Ionicons
                name={MEETING_STEPS[meeting.current_step]?.icon ?? 'ellipse'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.currentStepText}>
                Step {meeting.current_step + 1}: {MEETING_STEPS[meeting.current_step]?.label}
              </Text>
            </View>
          )}

          {/* Progress */}
          {isInProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((meeting.current_step + 1) / TOTAL_STEPS) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {meeting.current_step + 1} of {TOTAL_STEPS} steps
              </Text>
            </View>
          )}
        </View>

        {/* Evaluation Section */}
        <View style={styles.evalSection}>
          <Text style={styles.sectionTitle}>Your Evaluation</Text>

          {hasEvaluated && myEvaluation ? (
            <View style={styles.evalCompleteCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.evalCompleteTitle}>Evaluation Submitted</Text>
              <Text style={styles.evalCompleteScore}>
                Your Score: {myEvaluation.total_score}/{MAX_TOTAL_SCORE}
              </Text>
              {myEvaluation.total_score !== null && (
                <Text style={styles.evalCompleteGrade}>
                  {getScoreLabel(calculateScorePercentage(myEvaluation.total_score))}
                </Text>
              )}

              {/* Category breakdown */}
              <View style={styles.breakdownContainer}>
                <BreakdownRow label="Express Complaints" value={myEvaluation.express_complaints} colors={colors} styles={styles} />
                <BreakdownRow label="Parents Listened" value={myEvaluation.parents_listened} colors={colors} styles={styles} />
                <BreakdownRow label="Parents Asked Questions" value={myEvaluation.parents_asked_questions} colors={colors} styles={styles} />
                <BreakdownRow label="Liked Meeting" value={myEvaluation.liked_meeting} colors={colors} styles={styles} />
              </View>
            </View>
          ) : (
            <View style={styles.evalPromptCard}>
              <Ionicons name="clipboard-outline" size={32} color={colors.primary} />
              <Text style={styles.evalPromptTitle}>Rate This Meeting</Text>
              <Text style={styles.evalPromptSubtitle}>
                Tell your parents how the meeting went by rating 4 categories.
              </Text>
              <TouchableOpacity
                style={[styles.evalButton, !isInProgress && !isCompleted && styles.evalButtonDisabled]}
                onPress={() => setShowEvaluation(true)}
                disabled={!isInProgress && !isCompleted}
              >
                <Ionicons name="star" size={20} color={colors.textInverse} />
                <Text style={styles.evalButtonText}>Start Evaluation</Text>
              </TouchableOpacity>
              {!isInProgress && !isCompleted && (
                <Text style={styles.evalDisabledText}>
                  Evaluation will be available when the meeting starts.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Meeting Steps Overview */}
        <View style={styles.stepsOverview}>
          <Text style={styles.sectionTitle}>Meeting Steps</Text>
          {MEETING_STEPS.map((step, index) => {
            const isDone = index < meeting.current_step;
            const isCurrent = index === meeting.current_step && isInProgress;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={[styles.stepDot, isDone && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                  ) : (
                    <Text style={[styles.stepDotNumber, isCurrent && styles.stepDotNumberCurrent]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

function BreakdownRow({ label, value, colors, styles }: { label: string; value: number; colors: ThemeColors; styles: any }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <View style={styles.breakdownDots}>
        {[0, 1, 2, 3].map((v) => (
          <View
            key={v}
            style={[styles.breakdownDot, v <= value && styles.breakdownDotFilled]}
          />
        ))}
      </View>
      <Text style={styles.breakdownValue}>{value}/3</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    content: { padding: 16 },

    // Empty
    emptyCard: {
      alignItems: 'center', padding: 40,
      backgroundColor: colors.card, borderRadius: 16, marginTop: 40,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 16 },
    emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },

    // Status
    statusCard: {
      alignItems: 'center', padding: 24,
      backgroundColor: colors.card, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
      marginBottom: 24,
    },
    statusIconContainer: { marginBottom: 12 },
    statusTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    currentStepBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.primary + '15', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
      marginTop: 12,
    },
    currentStepText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    progressContainer: { width: '100%', marginTop: 16 },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.backgroundSecondary, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
    progressText: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 8 },

    // Evaluation
    evalSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
    evalCompleteCard: {
      alignItems: 'center', padding: 24,
      backgroundColor: colors.success + '11', borderRadius: 16,
    },
    evalCompleteTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 8 },
    evalCompleteScore: { fontSize: 20, fontWeight: '700', color: colors.success, marginTop: 8 },
    evalCompleteGrade: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    breakdownContainer: { width: '100%', marginTop: 16, gap: 8 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    breakdownLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    breakdownDots: { flexDirection: 'row', gap: 4 },
    breakdownDot: {
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: colors.backgroundSecondary,
    },
    breakdownDotFilled: { backgroundColor: colors.success },
    breakdownValue: { fontSize: 13, fontWeight: '600', color: colors.text, width: 28, textAlign: 'right' },

    evalPromptCard: {
      alignItems: 'center', padding: 24,
      backgroundColor: colors.card, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    evalPromptTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 8 },
    evalPromptSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 16 },
    evalButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14,
      borderRadius: 12, minHeight: 48,
    },
    evalButtonDisabled: { opacity: 0.4 },
    evalButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
    evalDisabledText: { fontSize: 12, color: colors.textTertiary, marginTop: 12, textAlign: 'center' },

    // Steps Overview
    stepsOverview: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    stepDot: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
    },
    stepDotDone: { backgroundColor: colors.success },
    stepDotCurrent: { backgroundColor: colors.primary },
    stepDotNumber: { fontSize: 13, fontWeight: '700', color: colors.textTertiary },
    stepDotNumberCurrent: { color: colors.textInverse },
    stepInfo: { flex: 1 },
    stepLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    stepLabelCurrent: { color: colors.primary },
    stepDesc: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  });
}
