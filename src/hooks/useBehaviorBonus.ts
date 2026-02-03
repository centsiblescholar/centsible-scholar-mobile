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
 * @param studentUserId - The student's user_id from student_profiles.user_id
 *                        (This is the generated UUID for parent-managed students,
 *                        or the auth user ID for students with their own accounts)
 */
async function fetchBehaviorAssessments(
  studentUserId: string
): Promise<BehaviorScores[]> {
  const eighteenWeeksAgo = new Date();
  eighteenWeeksAgo.setDate(eighteenWeeksAgo.getDate() - 126);
  const dateStart = eighteenWeeksAgo.toISOString().split('T')[0];

  // Query behavior assessments by student_user_id only
  // This is the consistent identifier for the student across all data tables
  const { data, error } = await supabase
    .from('behavior_assessments')
    .select('diet, exercise, work, hygiene, respect, responsibilities, attitude, cooperation, courtesy, service')
    .eq('student_user_id', studentUserId)
    .gte('date', dateStart)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching behavior assessments:', error);
    return [];
  }

  return data || [];
}

export function useBehaviorBonus(
  studentUserId: string | undefined,
  baseRewardAmount: number = 0
) {
  const { data: assessments, isLoading, error, refetch } = useQuery({
    queryKey: ['behaviorBonus', studentUserId],
    queryFn: () => fetchBehaviorAssessments(studentUserId!),
    enabled: !!studentUserId,
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
