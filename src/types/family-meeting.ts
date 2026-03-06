/**
 * Family Meeting Types
 * 6-step MI-based family meeting framework
 */

// ─── Meeting Steps ──────────────────────────────────────────
export const MEETING_STEPS = [
  { key: 'breathing', label: 'Breathing', icon: 'leaf-outline' as const, description: 'Center yourselves with mindful breathing' },
  { key: 'connection', label: 'Connection', icon: 'heart-outline' as const, description: 'Share something positive about each other' },
  { key: 'review', label: 'Review', icon: 'clipboard-outline' as const, description: 'Review goals and progress from last meeting' },
  { key: 'discussion', label: 'Discussion', icon: 'chatbubbles-outline' as const, description: 'Discuss conflicts and concerns' },
  { key: 'planning', label: 'Planning', icon: 'map-outline' as const, description: 'Set new goals and plans for the week' },
  { key: 'closing', label: 'Closing', icon: 'star-outline' as const, description: 'End with gratitude and child evaluations' },
] as const;

export type MeetingStepKey = typeof MEETING_STEPS[number]['key'];
export const TOTAL_STEPS = MEETING_STEPS.length;

// ─── Step Notes ─────────────────────────────────────────────
export interface StepNotes {
  breathing?: { completed: boolean };
  connection?: { topic: string };
  review?: { notes: string; goalsReviewed: string[] };
  discussion?: { notes: string; conflictsDiscussed: string[] };
  planning?: { notes: string; newGoals: string[] };
  closing?: { notes: string; gratitude: string };
}

// ─── Family Meeting ─────────────────────────────────────────
export interface FamilyMeeting {
  id: string;
  user_id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  recurrence: 'weekly' | 'biweekly' | 'monthly' | null;
  is_active: boolean;
  current_step: number;
  step_notes: StepNotes;
  goals_reviewed: string[];
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus = 'not_started' | 'in_progress' | 'completed';

export function getMeetingStatus(meeting: FamilyMeeting): MeetingStatus {
  if (meeting.current_step >= TOTAL_STEPS) return 'completed';
  if (meeting.started_at || meeting.current_step > 0) return 'in_progress';
  return 'not_started';
}

// ─── Child Evaluation (4 categories, 0-3 scale) ────────────
export const EVALUATION_CATEGORIES = [
  {
    key: 'express_complaints' as const,
    label: 'Express Complaints',
    description: 'Were you able to share your concerns?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'A little' },
      { value: 2, label: 'Mostly' },
      { value: 3, label: 'Completely' },
    ],
  },
  {
    key: 'parents_listened' as const,
    label: 'Parents Listened',
    description: 'Did your parents listen to you?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'A little' },
      { value: 2, label: 'Mostly' },
      { value: 3, label: 'Completely' },
    ],
  },
  {
    key: 'parents_asked_questions' as const,
    label: 'Parents Asked Questions',
    description: 'Did your parents ask about your thoughts?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'A little' },
      { value: 2, label: 'Mostly' },
      { value: 3, label: 'Completely' },
    ],
  },
  {
    key: 'liked_meeting' as const,
    label: 'Liked Meeting',
    description: 'Did you enjoy this family meeting?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'A little' },
      { value: 2, label: 'Mostly' },
      { value: 3, label: 'Completely' },
    ],
  },
] as const;

export type EvaluationCategoryKey = typeof EVALUATION_CATEGORIES[number]['key'];

export const MAX_SCORE_PER_CATEGORY = 3;
export const MAX_TOTAL_SCORE = EVALUATION_CATEGORIES.length * MAX_SCORE_PER_CATEGORY; // 12

export interface ChildEvaluation {
  id: string;
  meeting_id: string;
  student_user_id: string;
  express_complaints: number;
  parents_listened: number;
  parents_asked_questions: number;
  liked_meeting: number;
  total_score: number | null;
  created_at: string;
}

export interface EvaluationInput {
  express_complaints: number;
  parents_listened: number;
  parents_asked_questions: number;
  liked_meeting: number;
}

// ─── Meeting Goal ───────────────────────────────────────────
export type GoalStatus = 'active' | 'completed' | 'dropped';

export interface GoalSpecifics {
  measurable?: string;
  deadline?: string;
  reward?: string;
}

export interface MeetingGoal {
  id: string;
  meeting_id: string;
  student_user_id: string | null;
  goal_text: string;
  specifics: GoalSpecifics;
  status: GoalStatus;
  reviewed_in_meeting_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Conflict Queue ─────────────────────────────────────────
export type ConflictStatus = 'pending' | 'discussed' | 'resolved';

export interface MeetingConflict {
  id: string;
  user_id: string;
  added_by: string;
  description: string;
  status: ConflictStatus;
  discussed_in_meeting_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ─── Score Calculations ─────────────────────────────────────
export function calculateTotalScore(evaluation: EvaluationInput): number {
  return (
    evaluation.express_complaints +
    evaluation.parents_listened +
    evaluation.parents_asked_questions +
    evaluation.liked_meeting
  );
}

export function calculateScorePercentage(totalScore: number): number {
  return Math.round((totalScore / MAX_TOTAL_SCORE) * 100);
}

export function getScoreLabel(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Great';
  if (percentage >= 50) return 'Good';
  if (percentage >= 25) return 'Needs Improvement';
  return 'Poor';
}

export function getScoreColor(percentage: number): string {
  if (percentage >= 75) return '#22c55e'; // green
  if (percentage >= 50) return '#f59e0b'; // amber
  if (percentage >= 25) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function calculateAverageEvaluation(evaluations: ChildEvaluation[]): number | null {
  if (evaluations.length === 0) return null;
  const total = evaluations.reduce((sum, e) => sum + (e.total_score ?? 0), 0);
  return total / evaluations.length;
}
