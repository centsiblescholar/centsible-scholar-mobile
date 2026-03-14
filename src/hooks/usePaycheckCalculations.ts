import { useMemo } from 'react';
import { useStudentGrades } from './useStudentGrades';
import { useBehaviorBonus } from './useBehaviorBonus';
import { useEducationBonus } from './useEducationBonus';
import { calculateTotalAllocation } from '../shared/calculations/allocationCalculations';
import { TAX_RATES } from '../shared/calculations/constants';

export interface PaycheckCalculation {
  // Grade earnings
  gradeEarnings: number;
  gpa: number | null;
  gradeEntries: any[];

  // Bonuses
  behaviorBonusAmount: number;
  behaviorTier: string | null;
  educationBonusAmount: number;
  educationTier: string | null;

  // Totals
  totalEarnings: number;

  // Allocation
  allocation: {
    tax: number;
    retirement: number;
    savings: number;
    discretionary: number;
  } | null;

  // Loading
  isLoading: boolean;
}

/**
 * Composes grade, behavior, and education bonus hooks into a single
 * paycheck calculation result. Used by the term-tracking screen
 * for auto-populating paycheck cards.
 */
export function usePaycheckCalculations(
  studentUserId: string | undefined
): PaycheckCalculation {
  const {
    gradeEntries,
    totalReward: gradeEarnings,
    gpa,
    isLoading: gradesLoading,
  } = useStudentGrades(studentUserId);

  const {
    bonusAmount: behaviorBonusAmount,
    currentTier: behaviorTier,
    isLoading: behaviorLoading,
  } = useBehaviorBonus(studentUserId, gradeEarnings);

  const {
    bonusAmount: educationBonusAmount,
    currentTier: educationTier,
    isLoading: educationLoading,
  } = useEducationBonus(studentUserId, gradeEarnings);

  const totalEarnings = gradeEarnings + behaviorBonusAmount + educationBonusAmount;

  const allocation = useMemo(() => {
    if (totalEarnings <= 0) return null;
    return {
      tax: totalEarnings * TAX_RATES.INCOME_TAX,
      retirement: totalEarnings * TAX_RATES.RETIREMENT,
      savings: totalEarnings * TAX_RATES.SAVINGS,
      discretionary: totalEarnings * TAX_RATES.DISCRETIONARY,
    };
  }, [totalEarnings]);

  return {
    gradeEarnings,
    gpa: gpa || null,
    gradeEntries,
    behaviorBonusAmount,
    behaviorTier,
    educationBonusAmount,
    educationTier,
    totalEarnings,
    allocation,
    isLoading: gradesLoading || behaviorLoading || educationLoading,
  };
}
