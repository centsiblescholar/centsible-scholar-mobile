import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

/**
 * Education bonus tiers based on QOD accuracy
 * 90%+: 5% bonus
 * 80-89%: 4% bonus
 * 70-79%: 3% bonus
 * 60-69%: 2% bonus
 * 50-59%: 1% bonus
 * Below 50%: 0% bonus
 */
export const EDUCATION_BONUS_TIERS = {
  TIER_5: { min: 90, percentage: 0.05 },
  TIER_4: { min: 80, percentage: 0.04 },
  TIER_3: { min: 70, percentage: 0.03 },
  TIER_2: { min: 60, percentage: 0.02 },
  TIER_1: { min: 50, percentage: 0.01 },
} as const;

export interface EducationBonusResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  bonusPercentage: number;
  bonusAmount: number;
  currentTier: string | null;
}

function calculateEducationBonusPercentage(accuracy: number): number {
  if (accuracy >= EDUCATION_BONUS_TIERS.TIER_5.min) return EDUCATION_BONUS_TIERS.TIER_5.percentage;
  if (accuracy >= EDUCATION_BONUS_TIERS.TIER_4.min) return EDUCATION_BONUS_TIERS.TIER_4.percentage;
  if (accuracy >= EDUCATION_BONUS_TIERS.TIER_3.min) return EDUCATION_BONUS_TIERS.TIER_3.percentage;
  if (accuracy >= EDUCATION_BONUS_TIERS.TIER_2.min) return EDUCATION_BONUS_TIERS.TIER_2.percentage;
  if (accuracy >= EDUCATION_BONUS_TIERS.TIER_1.min) return EDUCATION_BONUS_TIERS.TIER_1.percentage;
  return 0;
}

function getTierLabel(accuracy: number): string | null {
  if (accuracy >= 90) return '90%+ (5%)';
  if (accuracy >= 80) return '80-89% (4%)';
  if (accuracy >= 70) return '70-79% (3%)';
  if (accuracy >= 60) return '60-69% (2%)';
  if (accuracy >= 50) return '50-59% (1%)';
  return null;
}

async function fetchEducationBonusData(userId: string): Promise<{
  totalQuestions: number;
  correctAnswers: number;
}> {
  const { data, error } = await supabase
    .from('question_of_day_results')
    .select('passed')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching QOD results:', error);
    return { totalQuestions: 0, correctAnswers: 0 };
  }

  const totalQuestions = data?.length || 0;
  const correctAnswers = data?.filter(r => r.passed).length || 0;

  return { totalQuestions, correctAnswers };
}

export function useEducationBonus(userId: string | undefined, baseRewardAmount: number = 0) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['educationBonus', userId],
    queryFn: () => fetchEducationBonusData(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const totalQuestions = data?.totalQuestions || 0;
  const correctAnswers = data?.correctAnswers || 0;
  const accuracyPercentage = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;
  const bonusPercentage = calculateEducationBonusPercentage(accuracyPercentage);
  const bonusAmount = baseRewardAmount * bonusPercentage;
  const currentTier = getTierLabel(accuracyPercentage);

  return {
    totalQuestions,
    correctAnswers,
    accuracyPercentage,
    bonusPercentage,
    bonusAmount,
    currentTier,
    isLoading,
    error,
    refetch,
  };
}
