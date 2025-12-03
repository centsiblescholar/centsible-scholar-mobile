import { GradeEntry, BehaviorBonus, AllocationBreakdown, BehaviorAssessment } from '../types';
import { TAX_RATES } from './constants';
import { calculateGradeReward } from './gradeCalculations';
import { calculateBehaviorBonus } from './behaviorCalculations';
import { convertToLetterGrade, isNumericalGrade } from '../utils/gradeConversion';

/**
 * Calculate comprehensive allocation breakdown
 */
export function calculateTotalAllocation(
  grades: GradeEntry[],
  bonuses?: BehaviorBonus[],
  behaviorAssessments?: BehaviorAssessment[],
  baseAmount?: number
): AllocationBreakdown {
  // Initialize allocation structure with safe defaults
  const allocation: AllocationBreakdown = {
    taxQualified: {
      taxes: 0,
      retirement: 0,
      total: 0
    },
    savings: 0,
    discretionary: 0,
    total: 0,
    sources: {
      grades: 0,
      behavior: 0
    }
  };

  try {
    // Calculate total income from grades (ensure letter grade format)
    const gradeIncome = Array.isArray(grades)
      ? grades.reduce((total, grade) => {
          if (grade && typeof grade.baseAmount === 'number' && grade.baseAmount > 0) {
            // Convert numerical grades to letter grades for consistent calculations
            const letterGrade = convertToLetterGrade(grade.grade);
            if (isNumericalGrade(grade.grade.toString())) {
              console.warn(`Converting numerical grade ${grade.grade} to letter grade ${letterGrade} for reward calculation`);
            }

            const normalizedGrade = { ...grade, grade: letterGrade };
            return total + calculateGradeReward(normalizedGrade);
          }
          return total;
        }, 0)
      : 0;

    // Calculate total income from behavior bonuses
    let bonusIncome = Array.isArray(bonuses)
      ? bonuses.reduce((total, bonus) => {
          if (bonus && typeof bonus.bonusAmount === 'number' && bonus.bonusAmount > 0) {
            return total + bonus.bonusAmount;
          }
          return total;
        }, 0)
      : 0;

    // Calculate behavior bonus from assessments if provided
    if (Array.isArray(behaviorAssessments) && behaviorAssessments.length > 0 && baseAmount && baseAmount > 0) {
      const totalScore = behaviorAssessments.reduce((sum, assessment) => {
        return sum + (
          assessment.diet + assessment.exercise + assessment.work +
          assessment.hygiene + assessment.respect + assessment.responsibilities +
          assessment.attitude + assessment.cooperation + assessment.courtesy +
          assessment.service
        );
      }, 0);

      const averageScore = totalScore / (behaviorAssessments.length * 10); // 10 categories
      const calculatedBehaviorBonus = calculateBehaviorBonus(averageScore, baseAmount);
      bonusIncome += calculatedBehaviorBonus;

      console.log(`Added behavior bonus from assessments: $${calculatedBehaviorBonus.toFixed(2)}`);
    }

    // Calculate total income
    const totalIncome = gradeIncome + bonusIncome;

    // Record income sources for transparency
    allocation.sources!.grades = gradeIncome;
    allocation.sources!.behavior = bonusIncome;
    allocation.total = totalIncome;

    // If no income, return empty allocation
    if (totalIncome <= 0) {
      console.log('No income to allocate');
      return allocation;
    }

    // Calculate tax-qualified allocations
    allocation.taxQualified.taxes = totalIncome * TAX_RATES.INCOME_TAX;
    allocation.taxQualified.retirement = totalIncome * TAX_RATES.RETIREMENT;
    allocation.taxQualified.total = allocation.taxQualified.taxes + allocation.taxQualified.retirement;

    // Calculate remaining allocations
    allocation.savings = totalIncome * TAX_RATES.SAVINGS;
    allocation.discretionary = totalIncome * TAX_RATES.DISCRETIONARY;

    // Log allocation summary for debugging
    console.log('Allocation Summary:', {
      totalIncome: totalIncome.toFixed(2),
      gradeIncome: gradeIncome.toFixed(2),
      behaviorIncome: bonusIncome.toFixed(2),
      taxes: allocation.taxQualified.taxes.toFixed(2),
      retirement: allocation.taxQualified.retirement.toFixed(2),
      savings: allocation.savings.toFixed(2),
      discretionary: allocation.discretionary.toFixed(2)
    });

    return allocation;

  } catch (error) {
    console.error('Error calculating total allocation:', error);
    return allocation; // Return safe defaults on error
  }
}

/**
 * Legacy function name for backward compatibility
 */
export function calculateAllocation(totalAmount: number): AllocationBreakdown {
  return {
    taxQualified: {
      taxes: totalAmount * TAX_RATES.INCOME_TAX,
      retirement: totalAmount * TAX_RATES.RETIREMENT,
      total: totalAmount * (TAX_RATES.INCOME_TAX + TAX_RATES.RETIREMENT)
    },
    savings: totalAmount * TAX_RATES.SAVINGS,
    discretionary: totalAmount * TAX_RATES.DISCRETIONARY,
    total: totalAmount,
    sources: {
      grades: totalAmount,
      behavior: 0
    }
  };
}
