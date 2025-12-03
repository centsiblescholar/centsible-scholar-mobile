/**
 * Shared type definitions for Centsible Scholar
 * Used by both web and mobile apps
 */

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeEntry {
  id: string;
  className: string;
  grade: Grade;
  rewardAmount: number;
  baseAmount: number;
}

export interface BehaviorScores {
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

export type BehaviorAssessmentStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'needs_revision'
  | 'parent_submitted'
  | 'student_disputed'
  | 'student_acknowledged';

export type BehaviorAssessmentOrigin = 'student' | 'parent';

export interface ScoreDispute {
  disputed_by: 'student' | 'parent';
  comment: string;
  original_score: number;
  disputed_at: string;
  resolved_by?: 'student' | 'parent';
  resolution_notes?: string;
  new_score?: number;
  resolved_at?: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BehaviorAssessment extends BehaviorScores {
  id: string;
  user_id: string;
  student_user_id: string;
  user?: UserProfile;
  date: string;
  status: BehaviorAssessmentStatus;
  submitted_at?: string;
  reviewed_at?: string;
  parent_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  originated_by?: BehaviorAssessmentOrigin;
  score_disputes?: Record<string, ScoreDispute>;
}

export interface BehaviorAssessmentInput extends BehaviorScores {
  user_id: string;
  student_user_id?: string;
  date: string;
  status?: BehaviorAssessmentStatus;
  parent_notes?: string;
  originated_by?: BehaviorAssessmentOrigin;
}

export interface AllocationBreakdown {
  taxQualified: {
    taxes: number;
    retirement: number;
    total: number;
  };
  savings: number;
  discretionary: number;
  total: number;
  sources?: {
    grades: number;
    behavior: number;
  };
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  student_id?: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  goal_emoji?: string;
  is_active: boolean;
  priority?: number;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface SavingsGoalInput {
  goal_name: string;
  target_amount: number;
  goal_emoji?: string;
  student_id?: string;
}

export interface TermConfig {
  id: string;
  user_id: string;
  term_length: 12 | 18 | 24;
  current_term_start: string;
  current_term_end: string;
  created_at: string;
}

export interface TermSnapshot {
  id: string;
  user_id: string;
  term_number: number;
  term_start: string;
  term_end: string;
  gpa: number;
  total_earnings: number;
  grade_earnings: number;
  behavior_earnings: number;
  allocation_breakdown: AllocationBreakdown;
  grades_data: GradeEntry[];
  created_at: string;
  updated_at: string;
}

export interface BehaviorBonus {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalScore: number;
  baseAmount: number;
  bonusAmount: number;
  status: 'pending' | 'paid';
  termId?: string;
  termNumber?: number;
  paidAt?: string;
}

export interface TermBonusSummary {
  termId: string;
  termNumber: number;
  totalPendingBonus: number;
  totalPaidBonus: number;
  bonusCount: number;
  termStart: string;
  termEnd: string;
}
