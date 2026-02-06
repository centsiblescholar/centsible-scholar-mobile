import { supabase } from '../integrations/supabase/client';

export interface StreakData {
  streak_count: number;
  longest_streak: number;
  last_qod_date: string | null;
  total_xp: number;
}

export interface XPAward {
  amount: number;
  reason: string;
}

/**
 * Calculate new streak count based on last completion date.
 * Returns:
 *   -1 = consecutive day (signal to increment current streak)
 *    0 = same day (no change)
 *    1 = missed a day or first time (reset to 1)
 */
export const calculateStreak = (lastQodDate: string | null, todayDate: string): number => {
  if (!lastQodDate) {
    return 1;
  }

  const lastDate = new Date(lastQodDate);
  const today = new Date(todayDate);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return -1; // Signal to increment current streak
  } else if (diffDays === 0) {
    return 0; // Same day -- no change
  } else {
    return 1; // Missed a day -- reset streak
  }
};

/**
 * Fetch current streak data for a student.
 * Queries by user_id (auth user ID), with email fallback matching useStudentProfile pattern.
 */
export const getStreakData = async (studentId: string, email?: string): Promise<StreakData | null> => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('streak_count, longest_streak, last_qod_date, total_xp')
      .eq('user_id', studentId)
      .maybeSingle();

    if (error) {
      return null;
    }

    // If not found by user_id and we have email, try email fallback
    if (!data && email) {
      const { data: emailData, error: emailError } = await supabase
        .from('student_profiles')
        .select('streak_count, longest_streak, last_qod_date, total_xp')
        .eq('email', email)
        .maybeSingle();

      if (emailError) {
        return null;
      }

      if (emailData) {
        return {
          streak_count: (emailData as Record<string, unknown>).streak_count as number || 0,
          longest_streak: (emailData as Record<string, unknown>).longest_streak as number || 0,
          last_qod_date: (emailData as Record<string, unknown>).last_qod_date as string | null,
          total_xp: (emailData as Record<string, unknown>).total_xp as number || 0,
        };
      }

      return null;
    }

    if (!data) return null;

    return {
      streak_count: (data as Record<string, unknown>).streak_count as number || 0,
      longest_streak: (data as Record<string, unknown>).longest_streak as number || 0,
      last_qod_date: (data as Record<string, unknown>).last_qod_date as string | null,
      total_xp: (data as Record<string, unknown>).total_xp as number || 0,
    };
  } catch {
    return null;
  }
};

/**
 * Update student's streak data after QOD completion.
 * Queries by user_id (auth user ID).
 */
export const updateStreakData = async (
  studentId: string,
  newStreakCount: number,
  todayDate: string
): Promise<void> => {
  try {
    // Fetch current longest streak to compare
    const { data: currentData, error: fetchError } = await supabase
      .from('student_profiles')
      .select('longest_streak')
      .eq('user_id', studentId)
      .single();

    if (fetchError) throw fetchError;

    const newLongestStreak = Math.max(
      (currentData as Record<string, unknown>).longest_streak as number || 0,
      newStreakCount
    );

    const { error } = await supabase
      .from('student_profiles')
      .update({
        streak_count: newStreakCount,
        longest_streak: newLongestStreak,
        last_qod_date: todayDate,
      } as Record<string, unknown>)
      .eq('user_id', studentId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

/**
 * Award XP to a student and record the transaction.
 * Queries by user_id (auth user ID).
 */
export const awardXP = async (
  userId: string,
  studentId: string,
  award: XPAward
): Promise<void> => {
  try {
    // Insert XP transaction (cast as any -- xp_transactions table not in generated types until migration)
    const { error: insertError } = await (supabase as any)
      .from('xp_transactions')
      .insert({
        user_id: userId,
        student_id: studentId,
        amount: award.amount,
        reason: award.reason,
      });

    if (insertError) throw insertError;

    // Update total XP on student profile
    const { data: currentData, error: fetchError } = await supabase
      .from('student_profiles')
      .select('total_xp')
      .eq('user_id', studentId)
      .single();

    if (fetchError) throw fetchError;

    const newTotalXP = ((currentData as Record<string, unknown>).total_xp as number || 0) + award.amount;

    const { error: updateError } = await supabase
      .from('student_profiles')
      .update({ total_xp: newTotalXP } as Record<string, unknown>)
      .eq('user_id', studentId);

    if (updateError) throw updateError;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate XP rewards based on answer correctness and streak milestones.
 * Base: 10 XP per question. +5 for correct answer. Milestone bonuses at 7/30/100 day streaks.
 */
export const calculateXPReward = (isCorrect: boolean, newStreakCount: number): XPAward[] => {
  const awards: XPAward[] = [];

  // Base XP for completing the question
  awards.push({
    amount: 10,
    reason: 'Daily Question completed',
  });

  // Bonus XP for correct answer
  if (isCorrect) {
    awards.push({
      amount: 5,
      reason: 'Correct answer bonus',
    });
  }

  // Milestone bonuses
  if (newStreakCount === 7) {
    awards.push({
      amount: 50,
      reason: '7-day streak milestone!',
    });
  } else if (newStreakCount === 30) {
    awards.push({
      amount: 100,
      reason: '30-day streak milestone!',
    });
  } else if (newStreakCount === 100) {
    awards.push({
      amount: 250,
      reason: '100-day streak milestone!',
    });
  }

  return awards;
};
