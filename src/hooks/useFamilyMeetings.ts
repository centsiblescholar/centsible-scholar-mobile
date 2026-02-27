import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import {
  FamilyMeeting,
  StepNotes,
  ChildEvaluation,
  EvaluationInput,
  MeetingGoal,
  GoalSpecifics,
  MeetingConflict,
  calculateTotalScore,
  TOTAL_STEPS,
} from '../types/family-meeting';

// ─── Query Keys ─────────────────────────────────────────────
export const familyMeetingsKeys = {
  all: ['familyMeetings'] as const,
  meeting: (userId: string) => [...familyMeetingsKeys.all, 'meeting', userId] as const,
  evaluations: (meetingId: string) => [...familyMeetingsKeys.all, 'evaluations', meetingId] as const,
  goals: (meetingId: string) => [...familyMeetingsKeys.all, 'goals', meetingId] as const,
  activeGoals: (userId: string) => [...familyMeetingsKeys.all, 'activeGoals', userId] as const,
  conflicts: (userId: string) => [...familyMeetingsKeys.all, 'conflicts', userId] as const,
};

// ─── Transform helpers ──────────────────────────────────────
function transformMeeting(row: any): FamilyMeeting {
  return {
    id: row.id,
    user_id: row.user_id,
    scheduled_date: row.scheduled_date,
    scheduled_time: row.scheduled_time,
    recurrence: row.recurrence,
    is_active: row.is_active,
    current_step: row.current_step ?? 0,
    step_notes: (row.step_notes as StepNotes) ?? {},
    goals_reviewed: (row.goals_reviewed as string[]) ?? [],
    started_at: row.started_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─── API Functions ──────────────────────────────────────────

async function fetchMeeting(userId: string): Promise<FamilyMeeting | null> {
  const { data, error } = await supabase
    .from('family_meetings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? transformMeeting(data) : null;
}

async function createOrGetMeeting(userId: string): Promise<FamilyMeeting> {
  const existing = await fetchMeeting(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('family_meetings')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return transformMeeting(data);
}

async function updateMeetingSchedule(
  meetingId: string,
  scheduledDate: string,
  scheduledTime: string,
  recurrence: string
): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      recurrence,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) throw error;
}

async function startMeetingFn(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      started_at: new Date().toISOString(),
      current_step: 0,
      step_notes: {},
      goals_reviewed: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) throw error;
}

async function advanceStepFn(
  meetingId: string,
  newStep: number,
  stepNotes: StepNotes
): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      current_step: newStep,
      step_notes: stepNotes as any,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) throw error;
}

async function completeMeetingFn(
  meetingId: string,
  stepNotes: StepNotes,
  goalsReviewed: string[]
): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      current_step: TOTAL_STEPS,
      step_notes: stepNotes as any,
      goals_reviewed: goalsReviewed as any,
      started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) throw error;
}

async function resetMeetingFn(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      current_step: 0,
      step_notes: {},
      goals_reviewed: [],
      started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) throw error;
}

// ─── Evaluations ────────────────────────────────────────────

async function fetchEvaluations(meetingId: string): Promise<ChildEvaluation[]> {
  const { data, error } = await supabase
    .from('meeting_child_evaluations')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function submitEvaluationFn(
  meetingId: string,
  studentUserId: string,
  input: EvaluationInput
): Promise<ChildEvaluation> {
  const totalScore = calculateTotalScore(input);

  const { data, error } = await supabase
    .from('meeting_child_evaluations')
    .insert({
      meeting_id: meetingId,
      student_user_id: studentUserId,
      express_complaints: input.express_complaints,
      parents_listened: input.parents_listened,
      parents_asked_questions: input.parents_asked_questions,
      liked_meeting: input.liked_meeting,
      total_score: totalScore,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Goals ──────────────────────────────────────────────────

async function fetchActiveGoals(userId: string): Promise<MeetingGoal[]> {
  const { data: meeting } = await supabase
    .from('family_meetings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!meeting) return [];

  const { data, error } = await supabase
    .from('meeting_goals')
    .select('*')
    .eq('meeting_id', meeting.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((g) => ({
    ...g,
    specifics: (g.specifics as GoalSpecifics) ?? {},
    status: g.status as MeetingGoal['status'],
  }));
}

async function createGoalFn(
  meetingId: string,
  goalText: string,
  studentUserId: string | null,
  specifics?: GoalSpecifics
): Promise<MeetingGoal> {
  const { data, error } = await supabase
    .from('meeting_goals')
    .insert({
      meeting_id: meetingId,
      student_user_id: studentUserId,
      goal_text: goalText,
      specifics: (specifics ?? {}) as any,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    specifics: (data.specifics as GoalSpecifics) ?? {},
    status: data.status as MeetingGoal['status'],
  };
}

async function updateGoalStatusFn(
  goalId: string,
  status: 'active' | 'completed' | 'dropped',
  reviewedInMeetingId?: string
): Promise<void> {
  const { error } = await supabase
    .from('meeting_goals')
    .update({
      status,
      reviewed_in_meeting_id: reviewedInMeetingId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  if (error) throw error;
}

// ─── Conflicts ──────────────────────────────────────────────

async function fetchConflicts(userId: string): Promise<MeetingConflict[]> {
  const { data, error } = await supabase
    .from('meeting_conflict_queue')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((c) => ({
    ...c,
    status: c.status as MeetingConflict['status'],
  }));
}

async function addConflictFn(
  userId: string,
  addedBy: string,
  description: string
): Promise<MeetingConflict> {
  const { data, error } = await supabase
    .from('meeting_conflict_queue')
    .insert({
      user_id: userId,
      added_by: addedBy,
      description,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, status: data.status as MeetingConflict['status'] };
}

async function resolveConflictFn(
  conflictId: string,
  meetingId: string
): Promise<void> {
  const { error } = await supabase
    .from('meeting_conflict_queue')
    .update({
      status: 'resolved',
      discussed_in_meeting_id: meetingId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', conflictId);

  if (error) throw error;
}

async function markConflictDiscussedFn(
  conflictId: string,
  meetingId: string
): Promise<void> {
  const { error } = await supabase
    .from('meeting_conflict_queue')
    .update({
      status: 'discussed',
      discussed_in_meeting_id: meetingId,
    })
    .eq('id', conflictId);

  if (error) throw error;
}

// ─── Main Hook ──────────────────────────────────────────────

export function useFamilyMeetings(userId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id || '';

  const {
    data: meeting,
    isLoading: meetingLoading,
    error: meetingError,
    refetch: refetchMeeting,
  } = useQuery({
    queryKey: familyMeetingsKeys.meeting(targetUserId),
    queryFn: () => fetchMeeting(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: activeGoals = [],
    isLoading: goalsLoading,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: familyMeetingsKeys.activeGoals(targetUserId),
    queryFn: () => fetchActiveGoals(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: conflicts = [],
    isLoading: conflictsLoading,
    refetch: refetchConflicts,
  } = useQuery({
    queryKey: familyMeetingsKeys.conflicts(targetUserId),
    queryFn: () => fetchConflicts(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: evaluations = [],
    refetch: refetchEvaluations,
  } = useQuery({
    queryKey: familyMeetingsKeys.evaluations(meeting?.id ?? ''),
    queryFn: () => fetchEvaluations(meeting!.id),
    enabled: !!meeting?.id,
    staleTime: 2 * 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: familyMeetingsKeys.all });
  };

  // ─── Mutations ──────────────────────────────────────────

  const createOrGetMeetingMutation = useMutation({
    mutationFn: () => createOrGetMeeting(targetUserId),
    onSuccess: invalidateAll,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (args: { meetingId: string; scheduledDate: string; scheduledTime: string; recurrence: string }) =>
      updateMeetingSchedule(args.meetingId, args.scheduledDate, args.scheduledTime, args.recurrence),
    onSuccess: invalidateAll,
  });

  const startMeetingMutation = useMutation({
    mutationFn: (meetingId: string) => startMeetingFn(meetingId),
    onSuccess: invalidateAll,
  });

  const advanceStepMutation = useMutation({
    mutationFn: (args: { meetingId: string; newStep: number; stepNotes: StepNotes }) =>
      advanceStepFn(args.meetingId, args.newStep, args.stepNotes),
    onSuccess: invalidateAll,
  });

  const completeMeetingMutation = useMutation({
    mutationFn: (args: { meetingId: string; stepNotes: StepNotes; goalsReviewed: string[] }) =>
      completeMeetingFn(args.meetingId, args.stepNotes, args.goalsReviewed),
    onSuccess: invalidateAll,
  });

  const resetMeetingMutation = useMutation({
    mutationFn: (meetingId: string) => resetMeetingFn(meetingId),
    onSuccess: invalidateAll,
  });

  const submitEvaluationMutation = useMutation({
    mutationFn: (args: { meetingId: string; studentUserId: string; input: EvaluationInput }) =>
      submitEvaluationFn(args.meetingId, args.studentUserId, args.input),
    onSuccess: invalidateAll,
  });

  const createGoalMutation = useMutation({
    mutationFn: (args: { meetingId: string; goalText: string; studentUserId: string | null; specifics?: GoalSpecifics }) =>
      createGoalFn(args.meetingId, args.goalText, args.studentUserId, args.specifics),
    onSuccess: invalidateAll,
  });

  const updateGoalStatusMutation = useMutation({
    mutationFn: (args: { goalId: string; status: 'active' | 'completed' | 'dropped'; reviewedInMeetingId?: string }) =>
      updateGoalStatusFn(args.goalId, args.status, args.reviewedInMeetingId),
    onSuccess: invalidateAll,
  });

  const addConflictMutation = useMutation({
    mutationFn: (args: { addedBy: string; description: string }) =>
      addConflictFn(targetUserId, args.addedBy, args.description),
    onSuccess: invalidateAll,
  });

  const resolveConflictMutation = useMutation({
    mutationFn: (args: { conflictId: string; meetingId: string }) =>
      resolveConflictFn(args.conflictId, args.meetingId),
    onSuccess: invalidateAll,
  });

  const markConflictDiscussedMutation = useMutation({
    mutationFn: (args: { conflictId: string; meetingId: string }) =>
      markConflictDiscussedFn(args.conflictId, args.meetingId),
    onSuccess: invalidateAll,
  });

  const pendingConflicts = conflicts.filter((c) => c.status === 'pending');
  const isInProgress = !!meeting?.started_at && (meeting.current_step ?? 0) < TOTAL_STEPS;

  const refetch = async () => {
    await Promise.all([
      refetchMeeting(),
      refetchGoals(),
      refetchConflicts(),
      refetchEvaluations(),
    ]);
  };

  return {
    meeting,
    activeGoals,
    conflicts,
    pendingConflicts,
    evaluations,
    isLoading: meetingLoading || goalsLoading || conflictsLoading,
    isInProgress,

    createOrGetMeeting: () => createOrGetMeetingMutation.mutateAsync(),
    updateSchedule: (meetingId: string, scheduledDate: string, scheduledTime: string, recurrence: string) =>
      updateScheduleMutation.mutateAsync({ meetingId, scheduledDate, scheduledTime, recurrence }),
    startMeeting: (meetingId: string) => startMeetingMutation.mutateAsync(meetingId),
    advanceStep: (meetingId: string, newStep: number, stepNotes: StepNotes) =>
      advanceStepMutation.mutateAsync({ meetingId, newStep, stepNotes }),
    completeMeeting: (meetingId: string, stepNotes: StepNotes, goalsReviewed: string[]) =>
      completeMeetingMutation.mutateAsync({ meetingId, stepNotes, goalsReviewed }),
    resetMeeting: (meetingId: string) => resetMeetingMutation.mutateAsync(meetingId),

    submitEvaluation: (meetingId: string, studentUserId: string, input: EvaluationInput) =>
      submitEvaluationMutation.mutateAsync({ meetingId, studentUserId, input }),

    createGoal: (meetingId: string, goalText: string, studentUserId: string | null, specifics?: GoalSpecifics) =>
      createGoalMutation.mutateAsync({ meetingId, goalText, studentUserId, specifics }),
    updateGoalStatus: (goalId: string, status: 'active' | 'completed' | 'dropped', reviewedInMeetingId?: string) =>
      updateGoalStatusMutation.mutateAsync({ goalId, status, reviewedInMeetingId }),

    addConflict: (addedBy: string, description: string) =>
      addConflictMutation.mutateAsync({ addedBy, description }),
    resolveConflict: (conflictId: string, meetingId: string) =>
      resolveConflictMutation.mutateAsync({ conflictId, meetingId }),
    markConflictDiscussed: (conflictId: string, meetingId: string) =>
      markConflictDiscussedMutation.mutateAsync({ conflictId, meetingId }),

    refetch,

    isStarting: startMeetingMutation.isPending,
    isAdvancing: advanceStepMutation.isPending,
    isCompleting: completeMeetingMutation.isPending,
    isSubmittingEvaluation: submitEvaluationMutation.isPending,
    isCreatingGoal: createGoalMutation.isPending,

    error: meetingError,
  };
}
