import { GradeEntry } from '../types';
import { GRADE_MULTIPLIERS } from './constants';

/**
 * Calculate reward amount for a single grade entry
 */
export function calculateGradeReward(gradeEntry: GradeEntry): number {
  // Validate input parameters
  if (!gradeEntry || typeof gradeEntry.baseAmount !== 'number') {
    console.warn('Invalid grade entry provided to calculateGradeReward');
    return 0;
  }

  // Ensure base amount is positive
  if (gradeEntry.baseAmount <= 0) {
    console.warn('Base amount must be positive for reward calculation');
    return 0;
  }

  // Get the multiplier for this grade (default to 0 for invalid grades)
  const multiplier = GRADE_MULTIPLIERS[gradeEntry.grade] ?? 0;

  // Log warning for invalid grades
  if (multiplier === 0 && gradeEntry.grade && !['F'].includes(gradeEntry.grade)) {
    console.warn(`Invalid grade "${gradeEntry.grade}" - only letter grades A, B, C, D, F are supported. Reward set to $0.`);
  }

  // Calculate and return the reward amount
  const reward = gradeEntry.baseAmount * multiplier;

  console.log(`Grade ${gradeEntry.grade} with base $${gradeEntry.baseAmount} = $${reward.toFixed(2)} reward`);
  return reward;
}

/**
 * Legacy function name for backward compatibility
 */
export function calculateReward(grade: string, baseAmount: number): number {
  return calculateGradeReward({ grade, baseAmount } as GradeEntry);
}

/**
 * Calculate Grade Point Average (GPA) from grade entries
 */
export function calculateGPA(grades: GradeEntry[]): number {
  // Validate input
  if (!Array.isArray(grades) || grades.length === 0) {
    return 0;
  }

  // GPA point values for each letter grade
  const gradePoints = {
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0
  };

  // Calculate total points and count valid grades
  let totalPoints = 0;
  let gradeCount = 0;

  grades.forEach(grade => {
    if (grade && grade.grade && grade.grade in gradePoints) {
      totalPoints += gradePoints[grade.grade as keyof typeof gradePoints];
      gradeCount++;
    }
  });

  // Return GPA (average of all grade points)
  const gpa = gradeCount > 0 ? totalPoints / gradeCount : 0;

  console.log(`Calculated GPA: ${gpa.toFixed(2)} from ${gradeCount} grades`);
  return gpa;
}
