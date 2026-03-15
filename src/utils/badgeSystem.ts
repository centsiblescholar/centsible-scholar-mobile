/**
 * Badge System for Centsible Scholar
 * Evaluates badge criteria against student data and tracks progress
 */

import { Badge, BadgeCriteria } from '../shared/types/badges';
import { GradeEntry, BehaviorAssessment } from '../shared/types';

export const BADGE_DEFINITIONS: Badge[] = [
  // Academic Badges - only for K-12 students
  {
    id: 'first_a',
    name: 'First A',
    description: 'Earned your first A grade!',
    icon: 'trophy',
    category: 'academic',
    rarity: 'common',
    criteria: { type: 'grade_count', threshold: 1, gradeRequired: 'A' },
    unlocked: false,
    gradeRestriction: 'K-12',
  },
  {
    id: 'straight_as',
    name: 'Straight A Student',
    description: 'Earned 5 A grades',
    icon: 'ribbon',
    category: 'academic',
    rarity: 'rare',
    criteria: { type: 'grade_count', threshold: 5, gradeRequired: 'A' },
    unlocked: false,
    gradeRestriction: 'K-12',
  },
  {
    id: 'honor_roll',
    name: 'Honor Roll',
    description: 'Maintained a 3.5+ GPA',
    icon: 'medal',
    category: 'academic',
    rarity: 'epic',
    criteria: { type: 'grade_average', threshold: 3.5 },
    unlocked: false,
    gradeRestriction: 'K-12',
  },

  // Behavior Badges - only for K-12 students
  {
    id: 'first_assessment',
    name: 'Getting Started',
    description: 'Completed your first behavior assessment',
    icon: 'star',
    category: 'behavior',
    rarity: 'common',
    criteria: { type: 'assessment_count', threshold: 1 },
    unlocked: false,
    gradeRestriction: 'K-12',
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Completed assessments for 7 days straight',
    icon: 'flame',
    category: 'streak',
    rarity: 'rare',
    criteria: { type: 'behavior_streak', threshold: 7 },
    unlocked: false,
    gradeRestriction: 'K-12',
  },
  {
    id: 'behavior_master',
    name: 'Behavior Master',
    description: 'Achieved 4.5+ average behavior score',
    icon: 'shield-checkmark',
    category: 'behavior',
    rarity: 'epic',
    criteria: { type: 'behavior_average', threshold: 4.5 },
    unlocked: false,
    gradeRestriction: 'K-12',
  },

  // Milestone Badges - available for all grade levels
  {
    id: 'first_hundred',
    name: 'First $100',
    description: 'Earned your first $100 in rewards',
    icon: 'cash',
    category: 'milestone',
    rarity: 'rare',
    criteria: { type: 'total_rewards', threshold: 100 },
    unlocked: false,
    gradeRestriction: 'all',
  },
  {
    id: 'high_earner',
    name: 'High Earner',
    description: 'Earned $500 in total rewards',
    icon: 'diamond',
    category: 'milestone',
    rarity: 'legendary',
    criteria: { type: 'total_rewards', threshold: 500 },
    unlocked: false,
    gradeRestriction: 'all',
  },
];

function isK12Student(gradeLevel?: string): boolean {
  if (!gradeLevel) return true;

  const lowerGrade = gradeLevel.toLowerCase();
  const k12Grades = [
    'k', 'kindergarten',
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
    'freshman', 'sophomore', 'junior', 'senior',
  ];

  return k12Grades.some(grade => lowerGrade.includes(grade));
}

export function evaluateBadges(
  grades: GradeEntry[],
  assessments: BehaviorAssessment[],
  totalRewards: number,
  currentBadges: Badge[],
  gradeLevel?: string,
): Badge[] {
  const updatedBadges = currentBadges.map(b => ({ ...b }));
  const isK12 = isK12Student(gradeLevel);

  for (const badge of updatedBadges) {
    if (badge.unlocked) continue;

    if (badge.gradeRestriction === 'K-12' && !isK12) {
      badge.progress = 0;
      badge.maxProgress = badge.criteria.threshold;
      continue;
    }

    const isUnlocked = checkBadgeCriteria(badge.criteria, grades, assessments, totalRewards);

    if (isUnlocked) {
      badge.unlocked = true;
      badge.unlockedAt = new Date().toISOString();
    } else {
      const progress = calculateBadgeProgress(badge.criteria, grades, assessments, totalRewards);
      badge.progress = progress.currentValue;
      badge.maxProgress = progress.targetValue;
    }
  }

  return updatedBadges;
}

function checkBadgeCriteria(
  criteria: BadgeCriteria,
  grades: GradeEntry[],
  assessments: BehaviorAssessment[],
  totalRewards: number,
): boolean {
  switch (criteria.type) {
    case 'grade_count': {
      const count = criteria.gradeRequired
        ? grades.filter(g => g.grade === criteria.gradeRequired).length
        : grades.length;
      return count >= criteria.threshold;
    }
    case 'grade_average': {
      if (grades.length === 0) return false;
      return calculateGPA(grades) >= criteria.threshold;
    }
    case 'assessment_count':
      return assessments.length >= criteria.threshold;
    case 'behavior_average': {
      if (assessments.length === 0) return false;
      return calculateAverageBehaviorScore(assessments) >= criteria.threshold;
    }
    case 'behavior_streak':
      return calculateBehaviorStreak(assessments) >= criteria.threshold;
    case 'total_rewards':
      return totalRewards >= criteria.threshold;
    default:
      return false;
  }
}

function calculateBadgeProgress(
  criteria: BadgeCriteria,
  grades: GradeEntry[],
  assessments: BehaviorAssessment[],
  totalRewards: number,
): { currentValue: number; targetValue: number } {
  let currentValue = 0;

  switch (criteria.type) {
    case 'grade_count':
      currentValue = criteria.gradeRequired
        ? grades.filter(g => g.grade === criteria.gradeRequired).length
        : grades.length;
      break;
    case 'grade_average':
      currentValue = grades.length > 0 ? calculateGPA(grades) : 0;
      break;
    case 'assessment_count':
      currentValue = assessments.length;
      break;
    case 'behavior_average':
      currentValue = assessments.length > 0 ? calculateAverageBehaviorScore(assessments) : 0;
      break;
    case 'behavior_streak':
      currentValue = calculateBehaviorStreak(assessments);
      break;
    case 'total_rewards':
      currentValue = totalRewards;
      break;
  }

  return {
    currentValue: Math.min(currentValue, criteria.threshold),
    targetValue: criteria.threshold,
  };
}

function calculateGPA(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0;
  const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const totalPoints = grades.reduce((sum, grade) => sum + (gradePoints[grade.grade] ?? 0), 0);
  return totalPoints / grades.length;
}

function calculateAverageBehaviorScore(assessments: BehaviorAssessment[]): number {
  if (assessments.length === 0) return 0;

  const totalScore = assessments.reduce((sum, assessment) => {
    const categories = [
      assessment.diet, assessment.exercise, assessment.work, assessment.hygiene,
      assessment.respect, assessment.responsibilities, assessment.attitude,
      assessment.cooperation, assessment.courtesy, assessment.service,
    ];
    const validCategories = categories.filter(score => score > 0);
    const avgForDay = validCategories.length > 0
      ? validCategories.reduce((daySum, score) => daySum + score, 0) / validCategories.length
      : 0;
    return sum + avgForDay;
  }, 0);

  return totalScore / assessments.length;
}

function calculateBehaviorStreak(assessments: BehaviorAssessment[]): number {
  if (assessments.length === 0) return 0;

  const sortedAssessments = [...assessments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const assessment of sortedAssessments) {
    const assessmentDate = new Date(assessment.date);
    assessmentDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
