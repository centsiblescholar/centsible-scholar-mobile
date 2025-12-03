/**
 * Financial calculation constants
 * Shared between web and mobile apps
 */

/**
 * Grade multipliers for reward calculations
 */
export const GRADE_MULTIPLIERS = {
  A: 1.0,
  B: 0.5,
  C: 0.20,
  D: 0.125,
  F: 0.0
} as const;

/**
 * Tax allocation percentages for financial planning
 */
export const TAX_RATES = {
  /** Percentage allocated for income taxes */
  INCOME_TAX: 0.15,

  /** Percentage allocated for retirement savings */
  RETIREMENT: 0.10,

  /** Percentage allocated for personal savings */
  SAVINGS: 0.25,

  /** Percentage available for discretionary spending */
  DISCRETIONARY: 0.50
} as const;

/**
 * Behavior score thresholds for bonus calculations
 * Updated to match UI display (3.0 minimum qualification, tiered percentages)
 */
export const BEHAVIOR_THRESHOLDS = {
  MINIMUM_QUALIFICATION: 3.0,
  TIER_1: 3.0,  // 3.00-3.49 avg: 5% bonus
  TIER_2: 3.5,  // 3.50-3.99 avg: 10% bonus
  TIER_3: 4.0,  // 4.00-4.49 avg: 15% bonus
  TIER_4: 4.5   // 4.50-5.00 avg: 20% bonus
} as const;
