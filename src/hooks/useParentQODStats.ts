import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, subMonths, subWeeks } from 'date-fns';

export type TimeRange = 'week' | 'month' | 'all';

export interface StudentQODStats {
  studentId: string;          // profile ID
  studentUserId: string;      // auth user ID
  studentName: string;
  gradeLevel: string;
  // Per-student stats (filtered by timeRange)
  percentage: number;         // accuracy percentage for selected range
  totalAttempts: number;      // QOD attempts in range
  correctAnswers: number;     // correct answers in range
  // Streaks (always all-time from profile)
  currentStreak: number;
  longestStreak: number;
  // XP (always all-time from profile)
  totalXP: number;
  // Today
  answeredToday: boolean;
  todayCorrect: boolean | null;
  // Meta
  lastAnswerDate: string | null;  // most recent QOD date
}

interface ParentQODStatsResult {
  studentStats: StudentQODStats[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  // Aggregates
  familyTotalXP: number;
  familyAveragePercentage: number;
  studentsWithActiveStreak: number;
  studentsAnsweredToday: number;
  totalStudents: number;
}

async function fetchParentQODStats(
  userId: string,
  timeRange: TimeRange
): Promise<StudentQODStats[]> {
  // 1. Get all students for this parent
  const { data: relationships, error: relError } = await supabase
    .from('parent_student_relationships')
    .select('student_user_id')
    .eq('parent_user_id', userId);

  if (relError) throw relError;

  if (!relationships || relationships.length === 0) {
    return [];
  }

  const studentUserIds = relationships.map(r => r.student_user_id);

  // 2. Get student profiles with streak/XP data
  const { data: profiles, error: profileError } = await supabase
    .from('student_profiles')
    .select('id, user_id, name, grade_level, streak_count, longest_streak, total_xp, last_qod_date')
    .in('user_id', studentUserIds)
    .eq('is_active', true);

  if (profileError) throw profileError;

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // 3. Calculate date range based on timeRange
  const today = format(new Date(), 'yyyy-MM-dd');
  let rangeStart: string;

  switch (timeRange) {
    case 'week':
      rangeStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      break;
    case 'month':
      rangeStart = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
      break;
    case 'all':
    default:
      rangeStart = format(subWeeks(new Date(), 18), 'yyyy-MM-dd');
      break;
  }

  // 4. Get QOD results for all students in range
  const { data: allResults, error: resultsError } = await supabase
    .from('question_of_day_results')
    .select('user_id, date, passed')
    .in('user_id', studentUserIds)
    .gte('date', rangeStart)
    .lte('date', today);

  if (resultsError) throw resultsError;

  // 5. Process per-student stats
  const stats: StudentQODStats[] = profiles.map(profile => {
    const p = profile as Record<string, unknown>;
    const studentResults = allResults?.filter(r => r.user_id === p.user_id) || [];

    // Today's result
    const todayResult = studentResults.find(r => r.date === today);

    // Stats for the selected time range
    const correctAnswers = studentResults.filter(r => r.passed).length;
    const totalAttempts = studentResults.length;
    const percentage = totalAttempts > 0
      ? Math.round((correctAnswers / totalAttempts) * 100)
      : 0;

    // Last answer date (most recent)
    const sortedDates = studentResults
      .map(r => r.date)
      .sort((a, b) => b.localeCompare(a));
    const lastAnswerDate = sortedDates.length > 0 ? sortedDates[0] : null;

    return {
      studentId: p.id as string,
      studentUserId: p.user_id as string,
      studentName: p.name as string,
      gradeLevel: p.grade_level as string,
      percentage,
      totalAttempts,
      correctAnswers,
      currentStreak: (p.streak_count as number) || 0,
      longestStreak: (p.longest_streak as number) || 0,
      totalXP: (p.total_xp as number) || 0,
      answeredToday: !!todayResult,
      todayCorrect: todayResult ? todayResult.passed : null,
      lastAnswerDate,
    };
  });

  // Sort alphabetically by name
  stats.sort((a, b) => a.studentName.localeCompare(b.studentName));

  return stats;
}

export function useParentQODStats(timeRange: TimeRange = 'all'): ParentQODStatsResult {
  const { user } = useAuth();

  const { data: studentStats = [], isLoading, error, refetch } = useQuery({
    queryKey: ['parentQODStats', user?.id, timeRange],
    queryFn: () => fetchParentQODStats(user!.id, timeRange),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate aggregated stats
  const familyTotalXP = studentStats.reduce((sum, s) => sum + s.totalXP, 0);

  const familyAveragePercentage = studentStats.length > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length)
    : 0;

  const studentsWithActiveStreak = studentStats.filter(s => s.currentStreak > 0).length;

  const studentsAnsweredToday = studentStats.filter(s => s.answeredToday).length;

  const totalStudents = studentStats.length;

  return {
    studentStats,
    isLoading,
    error: error as Error | null,
    refetch,
    familyTotalXP,
    familyAveragePercentage,
    studentsWithActiveStreak,
    studentsAnsweredToday,
    totalStudents,
  };
}
