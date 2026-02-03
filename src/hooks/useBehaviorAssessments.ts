import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { BehaviorScores, BehaviorAssessment } from '../shared/types';
import { calculateAssessmentAverageScore, calculateOverallAverageScore } from '../shared/calculations';

// Query key factory
export const behaviorAssessmentKeys = {
  all: ['behaviorAssessments'] as const,
  list: (userId: string) => [...behaviorAssessmentKeys.all, 'list', userId] as const,
};

/**
 * Fetches behavior assessments for a student.
 *
 * @param studentUserId - The student's user_id from student_profiles.user_id
 *                        (This is the generated UUID for parent-managed students,
 *                        or the auth user ID for students with their own accounts)
 */
async function fetchBehaviorAssessments(
  studentUserId: string
): Promise<BehaviorAssessment[]> {
  const today = new Date();
  const eighteenWeeksAgo = new Date();
  eighteenWeeksAgo.setDate(eighteenWeeksAgo.getDate() - 126); // 18 weeks
  const dateFilter = {
    start: eighteenWeeksAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  };

  // Query behavior assessments by student_user_id only
  // This is the consistent identifier for the student across all data tables
  const { data, error } = await supabase
    .from('behavior_assessments')
    .select('*')
    .eq('student_user_id', studentUserId)
    .gte('date', dateFilter.start)
    .lte('date', dateFilter.end)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching behavior assessments:', error);
    throw error;
  }

  // Cast to BehaviorAssessment[] - the DB schema matches but Supabase types are broader
  return (data || []) as BehaviorAssessment[];
}

async function saveAssessment(assessment: {
  user_id: string;
  date: string;
  scores: BehaviorScores;
  status: 'draft' | 'submitted';
}): Promise<void> {
  const { user_id, date, scores, status } = assessment;

  // Check if assessment exists for this date and student
  const { data: existing } = await supabase
    .from('behavior_assessments')
    .select('id')
    .eq('student_user_id', user_id)
    .eq('date', date)
    .maybeSingle();

  // Always set student_user_id for consistent querying
  const assessmentData = {
    user_id,
    student_user_id: user_id,
    date,
    ...scores,
    status,
    ...(status === 'submitted' ? {
      submitted_at: new Date().toISOString(),
    } : {}),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from('behavior_assessments')
      .update(assessmentData)
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('behavior_assessments')
      .insert(assessmentData);

    if (error) throw error;
  }
}

export function useBehaviorAssessments(studentUserId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use provided studentUserId or fall back to logged-in user's ID
  // When called from a parent view, studentUserId should be selectedStudent.user_id
  const targetUserId = studentUserId || user?.id || '';

  const { data: assessments = [], isLoading, error, refetch } = useQuery({
    queryKey: behaviorAssessmentKeys.list(targetUserId),
    queryFn: () => fetchBehaviorAssessments(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const saveMutation = useMutation({
    mutationFn: saveAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: behaviorAssessmentKeys.list(targetUserId) });
    },
  });

  // Calculate overall average
  const overallAverage = assessments.length > 0
    ? calculateOverallAverageScore(assessments)
    : 0;

  // Get today's assessment if exists
  const today = new Date().toISOString().split('T')[0];
  const todayAssessment = assessments.find(a => a.date === today);

  return {
    assessments,
    overallAverage,
    todayAssessment,
    isLoading,
    error,
    refetch,
    saveAssessment: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
