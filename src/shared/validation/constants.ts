/**
 * Validation Constants and Configuration
 *
 * Central configuration for all validation rules and thresholds
 * used throughout the Centsible Scholar application.
 */

import { Grade } from '../types';

/** Valid grade values for academic assessment validation */
export const VALID_GRADES: Grade[] = ['A', 'B', 'C', 'D', 'F'];

/** Valid behavior score range configuration (1-5 scale) */
export const BEHAVIOR_SCORE_CONFIG = {
  MIN: 1,
  MAX: 5,
  /** Scores below this threshold trigger improvement warnings */
  WARNING_THRESHOLD: 2,
  /** Scores above this threshold trigger excellence recognition */
  EXCELLENCE_THRESHOLD: 5
} as const;

/** Business rules for financial amounts and limits */
export const FINANCIAL_LIMITS = {
  /** Maximum reasonable base amount for grades (prevents data entry errors) */
  MAX_BASE_AMOUNT: 10000,
  /** Minimum meaningful base amount (ensures meaningful rewards) */
  MIN_BASE_AMOUNT: 0.01,
  /** Warning threshold for unusually high amounts */
  HIGH_AMOUNT_WARNING: 1000,
  /** Warning threshold for very low amounts */
  LOW_AMOUNT_WARNING: 1
} as const;

/**
 * Assessment date business rules and validation parameters
 *
 * These rules ensure assessments are recorded within reasonable timeframes
 * and help maintain data quality for reporting and analysis.
 */
export const DATE_VALIDATION_CONFIG = {
  /** Maximum days in the future assessments can be recorded */
  MAX_FUTURE_DAYS: 7,
  /** Days in the past after which warnings are issued */
  WARNING_PAST_DAYS: 90,
  /** Maximum days in the past for valid assessments */
  MAX_PAST_DAYS: 365
} as const;

/**
 * Descriptive labels for each score level
 *
 * Provides clear, actionable feedback for each score level
 * to help users understand what each rating means.
 */
export const SCORE_DESCRIPTIONS = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Good',
  5: 'Excellent'
} as const;
