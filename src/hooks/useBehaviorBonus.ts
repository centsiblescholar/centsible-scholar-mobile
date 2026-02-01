import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { calculateBehaviorBonus, calculateOverallAverageScore } from '../shared/calculations/behaviorCalculations';
import { BEHAVIOR_THRESHOLDS } from '../shared/calculations/constants';

export interface BehaviorBonusResult {
  averageScore: number;
  bonusPercentage: number;
  bonusAmount: number;
  currentTier: string | null;
  assessmentCount: number;
  qualifiesForBonus: boolean;
}

function getBonusPercentage(averageScore: number): number {
  if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_4) return 0.20;
  if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_3) return 0.15;
  if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_2) return 0.10;
  if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_1) return 0.05;
  return 0;
}

function getTierLabel(averageScore: number): string | null {
  if (averageScore >= 4.5) return '4.5-5.0 (20%)';
  if (averageScore >= 4.0) return '4.0-4.49 (15%)';
  if (averageScore >= 3.5) return '3.5-3.99 (10%)';
  if (averageScore >= 3.0) return '3.0-3.49 (5%)';
  return null;
}

interface BehaviorScores {
  diet: number;
  exercise: number;
  work: number;
  hygiene: number;
  respect: number;
  responsibilities: number;
  attitude: number;
  cooperation: number;
  courtesy: number;
  service: number;
}

/**
 * Fetches behavior assessments for bonus calculation.
 *
 * @param studentUserIdOrProfileId - Either the student's auth user_id or student_profiles.id
 * @param parentUserId - The parent's auth user_id (used to resolve profile IDs)
 */
async function fetchBehaviorAssessments(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<BehaviorScores[]> {
  const eighteenWeeksAgo = new Date();
  eighteenWeeksAgo.setDate(eighteenWeeksAgo.getDate() - 126);
  const dateStart = eighteenWeeksAgo.toISOString().split('T')[0];

  // Resolve the student's user_id if we have a profile ID
  let studentUserId = studentUserIdOrProfileId;

  if (parentUserId) {
    // Check if this is a student_profiles.id
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('user_id')
      .eq('id', studentUserIdOrProfileId)
      .maybeSingle();

    if (profile?.user_id) {
      studentUserId = profile.user_id;
    }
  }

  // Query behavior assessments using student_user_id
  const { data, error } = await supabase
    .from('behavior_assessments')
    .select('diet, exercise, work, hygiene, respect, responsibilities, attitude, cooperation, courtesy, service')
    .or(`user_id.eq.${studentUserId},student_user_id.eq.${studentUserId}`)
    .gte('date', dateStart)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching behavior assessments:', error);
    return [];
  }

  return data || [];
}

export function useBehaviorBonus(
  userId: string | undefined,
  baseRewardAmount: number = 0,
  parentUserId?: string
) {
  const { data: assessments, isLoading, error, refetch } = useQuery({
    queryKey: ['behaviorBonus', userId],
    queryFn: () => fetchBehaviorAssessments(userId!, parentUserId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const assessmentCount = assessments?.length || 0;
  const averageScore = assessments && assessments.length > 0
    ? calculateOverallAverageScore(assessments)
    : 0;
  const qualifiesForBonus = averageScore >= BEHAVIOR_THRESHOLDS.MINIMUM_QUALIFICATION;
  const bonusPercentage = getBonusPercentage(averageScore);
  const bonusAmount = calculateBehaviorBonus(averageScore, baseRewardAmount);
  const currentTier = getTierLabel(averageScore);

  return {
    averageScore,
    bonusPercentage,
    bonusAmount,
    currentTier,
    assessmentCount,
    qualifiesForBonus,
    isLoading,
    error,
    refetch,
  };
}
