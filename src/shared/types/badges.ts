/**
 * Badge type definitions for Centsible Scholar
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'academic' | 'behavior' | 'streak' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: BadgeCriteria;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  gradeRestriction?: 'K-12' | 'all';
}

export interface BadgeCriteria {
  type: 'grade_count' | 'grade_average' | 'behavior_streak' | 'behavior_average' | 'total_rewards' | 'assessment_count';
  threshold: number;
  timeframe?: 'week' | 'month' | 'term' | 'all_time';
  gradeRequired?: 'A' | 'B' | 'C';
}

export interface BadgeProgress {
  badgeId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
}
