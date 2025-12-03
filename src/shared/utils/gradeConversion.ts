import { Grade } from '../types';
import { calculateReward } from '../calculations/gradeCalculations';

/**
 * Convert numerical grades to letter grades for display
 */
export function convertToLetterGrade(grade: string | number): Grade {
  // If already a letter grade, return as is
  if (typeof grade === 'string' && ['A', 'B', 'C', 'D', 'F'].includes(grade)) {
    return grade as Grade;
  }

  // Convert to number if string
  const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade;

  // Handle invalid numbers
  if (isNaN(numGrade)) {
    console.warn(`Invalid grade value: ${grade}, defaulting to F`);
    return 'F';
  }

  // Standard grading scale conversion
  if (numGrade >= 90) return 'A';
  if (numGrade >= 80) return 'B';
  if (numGrade >= 70) return 'C';
  if (numGrade >= 60) return 'D';
  return 'F';
}

/**
 * Check if a grade is numerical
 */
export function isNumericalGrade(grade: string): boolean {
  return !['A', 'B', 'C', 'D', 'F'].includes(grade) && !isNaN(parseFloat(grade));
}

/**
 * Convert a grade entry to use letter grades for display and ensure reward consistency
 */
export function normalizeGradeForDisplay(gradeEntry: any) {
  const letterGrade = convertToLetterGrade(gradeEntry.grade);
  const baseAmount = gradeEntry.baseAmount && gradeEntry.baseAmount > 0 ? gradeEntry.baseAmount : 50; // Default fallback

  // Log if we're converting a numerical grade
  if (isNumericalGrade(gradeEntry.grade?.toString())) {
    console.warn(`Converting numerical grade ${gradeEntry.grade} to letter grade ${letterGrade} for display in ${gradeEntry.className || 'unknown class'}`);
  }

  // Always recalculate reward to ensure consistency between grade and reward
  const recalculatedReward = calculateReward(letterGrade, baseAmount);

  return {
    ...gradeEntry,
    grade: letterGrade,
    rewardAmount: recalculatedReward
  };
}
