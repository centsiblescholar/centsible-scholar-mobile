import { BEHAVIOR_THRESHOLDS } from './constants';

/**
 * Behavior assessment type for calculation purposes
 */
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
 * Calculate the average score across all behavior categories for a single assessment
 */
export function calculateAssessmentAverageScore(assessment: BehaviorScores): number {
  const scores = [
    assessment.diet,
    assessment.exercise,
    assessment.work,
    assessment.hygiene,
    assessment.respect,
    assessment.responsibilities,
    assessment.attitude,
    assessment.cooperation,
    assessment.courtesy,
    assessment.service,
  ].filter(score => score > 0);

  if (scores.length === 0) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Calculate the overall average score across multiple behavior assessments
 */
export function calculateOverallAverageScore(assessments: BehaviorScores[]): number {
  if (assessments.length === 0) return 0;

  const totalScore = assessments.reduce((sum, assessment) => {
    return sum + calculateAssessmentAverageScore(assessment);
  }, 0);

  return totalScore / assessments.length;
}

/**
 * Calculate behavior-based bonus amount using UI-consistent tiers
 */
export function calculateBehaviorBonus(averageScore: number, baseAmount: number): number {
  // Validate input parameters
  if (typeof averageScore !== 'number' || typeof baseAmount !== 'number') {
    console.warn('Invalid parameters provided to calculateBehaviorBonus');
    return 0;
  }

  // Ensure parameters are within valid ranges
  if (averageScore <= 0 || baseAmount <= 0) {
    console.warn('Average score and base amount must be positive');
    return 0;
  }

  // Check minimum qualification threshold
  if (averageScore < BEHAVIOR_THRESHOLDS.MINIMUM_QUALIFICATION) {
    console.log(`Score ${averageScore.toFixed(2)} below minimum qualification (${BEHAVIOR_THRESHOLDS.MINIMUM_QUALIFICATION})`);
    return 0;
  }

  // Determine bonus percentage based on UI tiers
  let bonusPercentage = 0;

  if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_4) {
    bonusPercentage = 0.20; // 20% bonus for 4.50-5.00 average
  } else if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_3) {
    bonusPercentage = 0.15; // 15% bonus for 4.00-4.49 average
  } else if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_2) {
    bonusPercentage = 0.10; // 10% bonus for 3.50-3.99 average
  } else if (averageScore >= BEHAVIOR_THRESHOLDS.TIER_1) {
    bonusPercentage = 0.05; // 5% bonus for 3.00-3.49 average
  }

  // Calculate bonus amount
  const bonus = baseAmount * bonusPercentage;

  console.log(`Behavior score ${averageScore.toFixed(2)} with base $${baseAmount} = $${bonus.toFixed(2)} bonus (${(bonusPercentage * 100)}%)`);
  return bonus;
}
