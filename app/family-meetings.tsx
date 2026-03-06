import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useFamilyMeetings } from '../src/hooks/useFamilyMeetings';
import { useParentStudents } from '../src/hooks/useParentStudents';
import { useTheme, type ThemeColors } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  MEETING_STEPS,
  TOTAL_STEPS,
  StepNotes,
  getMeetingStatus,
  EvaluationInput,
} from '../src/types/family-meeting';
import { MeetingStepper } from '../src/components/meetings/MeetingStepper';
import { MeetingStep1Breathing } from '../src/components/meetings/MeetingStep1Breathing';
import { MeetingStep2Connection } from '../src/components/meetings/MeetingStep2Connection';
import { MeetingStep3Review } from '../src/components/meetings/MeetingStep3Review';
import { MeetingStep4Discussion } from '../src/components/meetings/MeetingStep4Discussion';
import { MeetingStep5Planning } from '../src/components/meetings/MeetingStep5Planning';
import { MeetingStep6Closing } from '../src/components/meetings/MeetingStep6Closing';
import { MeetingCompletedCard } from '../src/components/meetings/MeetingCompletedCard';
import { StudentMeetingView } from '../src/components/meetings/StudentMeetingView';

export default function FamilyMeetingsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isParent } = useUserProfile();
  const { students } = useParentStudents();
  const [refreshing, setRefreshing] = useState(false);

  const {
    meeting,
    activeGoals,
    pendingConflicts,
    evaluations,
    isLoading,
    isInProgress,
    isSubmittingEvaluation,
    createOrGetMeeting,
    startMeeting,
    advanceStep,
    completeMeeting,
    resetMeeting,
    submitEvaluation,
    createGoal,
    updateGoalStatus,
    addConflict,
    resolveConflict,
    markConflictDiscussed,
    refetch,
    error,
  } = useFamilyMeetings(user?.id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ─── Step Notes Management ──────────────────────────────────
  const currentStepNotes = (meeting?.step_notes ?? {}) as StepNotes;
  const currentStep = meeting?.current_step ?? 0;

  const updateStepNotes = useCallback(
    (key: string, data: any) => {
      return { ...currentStepNotes, [key]: data };
    },
    [currentStepNotes]
  );

  const goToNextStep = useCallback(
    async (updatedNotes: StepNotes) => {
      if (!meeting) return;
      const nextStep = currentStep + 1;
      if (nextStep >= TOTAL_STEPS) {
        // Complete the meeting
        await completeMeeting(meeting.id, updatedNotes, meeting.goals_reviewed);
      } else {
        await advanceStep(meeting.id, nextStep, updatedNotes);
      }
    },
    [meeting, currentStep, advanceStep, completeMeeting]
  );

  const goToPrevStep = useCallback(async () => {
    if (!meeting || currentStep <= 0) return;
    await advanceStep(meeting.id, currentStep - 1, currentStepNotes);
  }, [meeting, currentStep, currentStepNotes, advanceStep]);

  // ─── Start Meeting ──────────────────────────────────────────
  const handleStartMeeting = useCallback(async () => {
    try {
      const m = await createOrGetMeeting();
      await startMeeting(m.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start meeting');
    }
  }, [createOrGetMeeting, startMeeting]);

  const handleExitMeeting = useCallback(() => {
    Alert.alert(
      'Exit Meeting',
      'Your progress is saved. You can resume anytime.',
      [
        { text: 'Continue Meeting', style: 'cancel' },
        { text: 'Exit', onPress: () => {} }, // just dismiss — state is already saved in DB
      ]
    );
  }, []);

  const handleResetMeeting = useCallback(async () => {
    if (!meeting) return;
    Alert.alert(
      'Start New Meeting',
      'This will reset the current meeting progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetMeeting(meeting.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reset meeting');
            }
          },
        },
      ]
    );
  }, [meeting, resetMeeting]);

  // ─── Step Handlers ──────────────────────────────────────────

  const handleStep1Complete = useCallback(async () => {
    const notes = updateStepNotes('breathing', { completed: true });
    await goToNextStep(notes);
  }, [updateStepNotes, goToNextStep]);

  const handleStep2Complete = useCallback(
    async (topic: string) => {
      const notes = updateStepNotes('connection', { topic });
      await goToNextStep(notes);
    },
    [updateStepNotes, goToNextStep]
  );

  const handleStep3Complete = useCallback(
    async (reviewNotes: string, reviewedGoalIds: string[]) => {
      const notes = updateStepNotes('review', { notes: reviewNotes, goalsReviewed: reviewedGoalIds });
      await goToNextStep(notes);
    },
    [updateStepNotes, goToNextStep]
  );

  const handleStep4Complete = useCallback(
    async (discussionNotes: string, discussedConflictIds: string[]) => {
      const notes = updateStepNotes('discussion', { notes: discussionNotes, conflictsDiscussed: discussedConflictIds });
      await goToNextStep(notes);
    },
    [updateStepNotes, goToNextStep]
  );

  const handleStep5Complete = useCallback(
    async (planningNotes: string) => {
      const notes = updateStepNotes('planning', { notes: planningNotes });
      await goToNextStep(notes);
    },
    [updateStepNotes, goToNextStep]
  );

  const handleStep6Complete = useCallback(
    async (closingNotes: string, gratitude: string) => {
      const notes = updateStepNotes('closing', { notes: closingNotes, gratitude });
      await goToNextStep(notes);
    },
    [updateStepNotes, goToNextStep]
  );

  const handleSubmitEvaluation = useCallback(
    async (studentUserId: string, input: EvaluationInput) => {
      if (!meeting) return;
      try {
        await submitEvaluation(meeting.id, studentUserId, input);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to submit evaluation');
      }
    },
    [meeting, submitEvaluation]
  );

  const handleCreateGoal = useCallback(
    async (goalText: string, studentUserId: string | null) => {
      if (!meeting) return;
      try {
        await createGoal(meeting.id, goalText, studentUserId);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to create goal');
      }
    },
    [meeting, createGoal]
  );

  const handleUpdateGoalStatus = useCallback(
    async (goalId: string, status: 'completed' | 'dropped') => {
      if (!meeting) return;
      try {
        await updateGoalStatus(goalId, status, meeting.id);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update goal');
      }
    },
    [meeting, updateGoalStatus]
  );

  const handleResolveConflict = useCallback(
    async (conflictId: string) => {
      if (!meeting) return;
      try {
        await resolveConflict(conflictId, meeting.id);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to resolve conflict');
      }
    },
    [meeting, resolveConflict]
  );

  const handleMarkDiscussed = useCallback(
    async (conflictId: string) => {
      if (!meeting) return;
      try {
        await markConflictDiscussed(conflictId, meeting.id);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to mark discussed');
      }
    },
    [meeting, markConflictDiscussed]
  );

  const handleAddConflict = useCallback(
    async (description: string) => {
      try {
        await addConflict(user?.email || 'Parent', description);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to add conflict');
      }
    },
    [addConflict, user]
  );

  // ─── Loading / Error States ─────────────────────────────────

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonList count={3} cardHeight={100} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState message="Failed to load meetings" onRetry={refetch} />
      </View>
    );
  }

  // ─── Student View ───────────────────────────────────────────

  if (!isParent) {
    return (
      <StudentMeetingView
        meeting={meeting ?? null}
        evaluations={evaluations}
        isLoading={isLoading}
        onSubmitEvaluation={submitEvaluation}
        isSubmittingEvaluation={isSubmittingEvaluation}
        onRefresh={refetch}
      />
    );
  }

  // ─── Meeting In Progress (Stepper View) ─────────────────────

  if (isInProgress && meeting) {
    const renderCurrentStep = () => {
      switch (currentStep) {
        case 0:
          return (
            <MeetingStep1Breathing
              completed={!!currentStepNotes.breathing?.completed}
              onComplete={handleStep1Complete}
            />
          );
        case 1:
          return (
            <MeetingStep2Connection
              initialTopic={currentStepNotes.connection?.topic}
              onComplete={handleStep2Complete}
            />
          );
        case 2:
          return (
            <MeetingStep3Review
              activeGoals={activeGoals}
              initialNotes={currentStepNotes.review?.notes}
              initialReviewedGoals={currentStepNotes.review?.goalsReviewed}
              onComplete={handleStep3Complete}
              onUpdateGoalStatus={handleUpdateGoalStatus}
            />
          );
        case 3:
          return (
            <MeetingStep4Discussion
              pendingConflicts={pendingConflicts}
              meetingId={meeting.id}
              initialNotes={currentStepNotes.discussion?.notes}
              onComplete={handleStep4Complete}
              onResolveConflict={handleResolveConflict}
              onMarkDiscussed={handleMarkDiscussed}
              onAddConflict={handleAddConflict}
            />
          );
        case 4:
          return (
            <MeetingStep5Planning
              students={students}
              meetingId={meeting.id}
              initialNotes={currentStepNotes.planning?.notes}
              onComplete={handleStep5Complete}
              onCreateGoal={handleCreateGoal}
            />
          );
        case 5:
          return (
            <MeetingStep6Closing
              students={students}
              meetingId={meeting.id}
              evaluations={evaluations}
              initialNotes={currentStepNotes.closing?.notes}
              onComplete={handleStep6Complete}
              onSubmitEvaluation={handleSubmitEvaluation}
              isSubmittingEvaluation={isSubmittingEvaluation}
            />
          );
        default:
          return null;
      }
    };

    return (
      <MeetingStepper
        currentStep={currentStep}
        onBack={currentStep > 0 ? goToPrevStep : null}
        onExit={handleExitMeeting}
      >
        {renderCurrentStep()}
      </MeetingStepper>
    );
  }

  // ─── Meeting Completed ──────────────────────────────────────

  const meetingStatus = meeting ? getMeetingStatus(meeting) : 'not_started';

  if (meetingStatus === 'completed' && meeting) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <MeetingCompletedCard
          evaluations={evaluations}
          onStartNew={handleResetMeeting}
        />
      </ScrollView>
    );
  }

  // ─── Home / Start View ──────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Family Meeting</Text>
          <Text style={styles.heroSubtitle}>
            A structured 6-step process to connect, review goals, discuss
            concerns, and plan together.
          </Text>
        </View>

        {/* Steps Preview */}
        <View style={styles.stepsPreview}>
          <Text style={styles.sectionTitle}>Meeting Steps</Text>
          {MEETING_STEPS.map((step, index) => (
            <View key={step.key} style={styles.stepPreviewItem}>
              <View style={styles.stepPreviewNumber}>
                <Text style={styles.stepPreviewNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepPreviewContent}>
                <View style={styles.stepPreviewHeader}>
                  <Ionicons name={step.icon} size={18} color={colors.primary} />
                  <Text style={styles.stepPreviewLabel}>{step.label}</Text>
                </View>
                <Text style={styles.stepPreviewDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="flag" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{activeGoals.length}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.statValue}>{pendingConflicts.length}</Text>
            <Text style={styles.statLabel}>Pending Topics</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color={colors.success} />
            <Text style={styles.statValue}>{students.length}</Text>
            <Text style={styles.statLabel}>Children</Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartMeeting}>
          <Ionicons name="play-circle" size={24} color={colors.textInverse} />
          <Text style={styles.startButtonText}>Start Family Meeting</Text>
        </TouchableOpacity>

        {/* Resume notice if meeting was in progress */}
        {meeting && meeting.started_at && meeting.current_step > 0 && meeting.current_step < TOTAL_STEPS && (
          <View style={styles.resumeCard}>
            <Ionicons name="time" size={20} color={colors.warning} />
            <View style={styles.resumeContent}>
              <Text style={styles.resumeText}>You have a meeting in progress</Text>
              <Text style={styles.resumeStep}>
                Step {meeting.current_step + 1}: {MEETING_STEPS[meeting.current_step]?.label}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: 16 },
    content: { padding: 16 },

    // Hero
    heroCard: {
      alignItems: 'center', padding: 32,
      backgroundColor: colors.card, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
      marginBottom: 24,
    },
    heroIconContainer: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.primary + '15',
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    heroTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    heroSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },

    // Steps Preview
    stepsPreview: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
      marginBottom: 24,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    stepPreviewItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    stepPreviewNumber: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.primary + '15',
      alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
    },
    stepPreviewNumberText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    stepPreviewContent: { flex: 1 },
    stepPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    stepPreviewLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    stepPreviewDescription: { fontSize: 13, color: colors.textTertiary, lineHeight: 18 },

    // Stats
    statsRow: {
      flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 20,
      marginBottom: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: colors.border },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 8 },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

    // Start Button
    startButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: colors.primary, padding: 18, borderRadius: 16,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
      minHeight: 56,
    },
    startButtonText: { fontSize: 18, fontWeight: '700', color: colors.textInverse },

    // Resume
    resumeCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.warning + '15', borderRadius: 12, padding: 16, marginTop: 16,
    },
    resumeContent: { flex: 1 },
    resumeText: { fontSize: 14, fontWeight: '600', color: colors.text },
    resumeStep: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  });
}
