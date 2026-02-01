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
 * @param studentUserIdOrProfileId - Either the student's auth user_id (if they have an account)
 *                                    or the student_profiles.id (for parent-managed students)
 * @param parentUserId - The parent's auth user_id (optional, used to look up student via relationships)
 */
async function fetchBehaviorAssessments(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<BehaviorAssessment[]> {
  const today = new Date();
  const eighteenWeeksAgo = new Date();
  eighteenWeeksAgo.setDate(eighteenWeeksAgo.getDate() - 126); // 18 weeks
  const dateFilter = {
    start: eighteenWeeksAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  };

  // If we have a parent user ID, look up the student's user_id via relationships
  let studentUserId = studentUserIdOrProfileId;

  if (parentUserId) {
    // First, check if this is a student_profiles.id by looking it up
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('user_id')
      .eq('id', studentUserIdOrProfileId)
      .maybeSingle();

    if (profile?.user_id) {
      // Found a profile - use the user_id from the profile
      studentUserId = profile.user_id;
    } else {
      // Not a profile ID - try looking up via parent_student_relationships
      const { data: relationship } = await supabase
        .from('parent_student_relationships')
        .select('student_user_id')
        .eq('parent_user_id', parentUserId)
        .eq('student_user_id', studentUserIdOrProfileId)
        .maybeSingle();

      if (relationship?.student_user_id) {
        studentUserId = relationship.student_user_id;
      }
    }
  }

  // Query behavior assessments using student_user_id
  const { data, error } = await supabase
    .from('behavior_assessments')
    .select('*')
    .or(`user_id.eq.${studentUserId},student_user_id.eq.${studentUserId}`)
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

  // Check if assessment exists for this date
  const { data: existing } = await supabase
    .from('behavior_assessments')
    .select('id')
    .eq('user_id', user_id)
    .eq('date', date)
    .maybeSingle();

  const assessmentData = {
    user_id,
    date,
    ...scores,
    status,
    ...(status === 'submitted' ? {
      submitted_at: new Date().toISOString(),
      student_user_id: user_id
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
  const targetUserId = studentUserId || user?.id || '';
  const parentUserId = user?.id;

  const { data: assessments = [], isLoading, error, refetch } = useQuery({
    queryKey: behaviorAssessmentKeys.list(targetUserId),
    queryFn: () => fetchBehaviorAssessments(targetUserId, parentUserId),
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
