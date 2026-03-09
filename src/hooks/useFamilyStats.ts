import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { StudentInfo } from './useParentStudents';
import { GRADE_MULTIPLIERS } from '../shared/calculations/constants';

interface StudentSummary {
  gpa: number;
  totalRewards: number;
  behaviorScore: number;
  qodAccuracy: number;
}

interface FamilyStats {
  familyGPA: number;
  totalRewards: number;
  averageBehaviorScore: number;
  qodAccuracy: number;
  studentSummaries: Record<string, StudentSummary>;
}

/**
 * Fetches aggregated family-level stats across all students.
 * Mirrors the web app's useFamilyGPA + useStudentSummaryData + useParentQODStats.
 */
async function fetchFamilyStats(
  students: StudentInfo[],
  parentUserId: string,
): Promise<FamilyStats> {
  const summaries: Record<string, StudentSummary> = {};
  let totalGPASum = 0;
  let totalGPACount = 0;
  let totalRewards = 0;
  let totalBehaviorSum = 0;
  let totalBehaviorCount = 0;
  let totalQodCorrect = 0;
  let totalQodTotal = 0;

  // Fetch data for each student in parallel
  const studentPromises = students.map(async (student) => {
    const studentUserId = student.user_id;

    // 1. Grades
    const { data: grades } = await supabase
      .from('student_grades')
      .select('grade, base_amount')
      .eq('student_user_id', studentUserId);

    let gpa = 0;
    let studentRewards = 0;
    if (grades && grades.length > 0) {
      // GPA calculation (straight letter grades only)
      const gradePoints: Record<string, number> = {
        A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0,
      };
      const validGrades = grades.filter(g => gradePoints[g.grade] !== undefined);
      if (validGrades.length > 0) {
        gpa = validGrades.reduce((sum, g) => sum + (gradePoints[g.grade] || 0), 0) / validGrades.length;
        totalGPASum += gpa;
        totalGPACount++;
      }
      // Reward calculation using shared GRADE_MULTIPLIERS (single source of truth)
      studentRewards = grades.reduce((sum, g) => {
        const mult = GRADE_MULTIPLIERS[g.grade as keyof typeof GRADE_MULTIPLIERS] ?? 0;
        return sum + ((g.base_amount || 0) * mult);
      }, 0);
      totalRewards += studentRewards;
    }

    // 2. Behavior (last 5 assessments)
    const { data: assessments } = await supabase
      .from('behavior_assessments')
      .select('diet,exercise,work,hygiene,respect,responsibilities,attitude,cooperation,courtesy,service')
      .eq('student_user_id', studentUserId)
      .order('date', { ascending: false })
      .limit(5);

    let behaviorScore = 0;
    if (assessments && assessments.length > 0) {
      const allScores = assessments.map(a => {
        const cats = [a.diet, a.exercise, a.work, a.hygiene, a.respect, a.responsibilities, a.attitude, a.cooperation, a.courtesy, a.service];
        return cats.reduce((s, v) => s + (v || 0), 0) / cats.length;
      });
      behaviorScore = allScores.reduce((s, v) => s + v, 0) / allScores.length;
      totalBehaviorSum += behaviorScore;
      totalBehaviorCount++;
    }

    // 3. QOD accuracy
    const eighteenWeeksAgo = new Date();
    eighteenWeeksAgo.setDate(eighteenWeeksAgo.getDate() - 126);
    const { data: qodResults } = await supabase
      .from('question_of_day_results')
      .select('passed')
      .eq('user_id', studentUserId)
      .gte('created_at', eighteenWeeksAgo.toISOString());

    let qodAccuracy = 0;
    if (qodResults && qodResults.length > 0) {
      const correct = qodResults.filter(r => r.passed).length;
      qodAccuracy = Math.round((correct / qodResults.length) * 100);
      totalQodCorrect += correct;
      totalQodTotal += qodResults.length;
    }

    summaries[studentUserId] = {
      gpa,
      totalRewards: studentRewards,
      behaviorScore,
      qodAccuracy,
    };
  });

  await Promise.all(studentPromises);

  return {
    familyGPA: totalGPACount > 0 ? totalGPASum / totalGPACount : 0,
    totalRewards,
    averageBehaviorScore: totalBehaviorCount > 0 ? totalBehaviorSum / totalBehaviorCount : 0,
    qodAccuracy: totalQodTotal > 0 ? Math.round((totalQodCorrect / totalQodTotal) * 100) : 0,
    studentSummaries: summaries,
  };
}

export function useFamilyStats(students: StudentInfo[]) {
  const { user } = useAuth();
  const parentUserId = user?.id || '';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['familyStats', parentUserId, students.map(s => s.user_id).join(',')],
    queryFn: () => fetchFamilyStats(students, parentUserId),
    enabled: !!parentUserId && students.length > 0,
    staleTime: 2 * 60 * 1000, // 2 min
  });

  return {
    familyGPA: data?.familyGPA ?? 0,
    totalRewards: data?.totalRewards ?? 0,
    averageBehaviorScore: data?.averageBehaviorScore ?? 0,
    qodAccuracy: data?.qodAccuracy ?? 0,
    studentSummaries: data?.studentSummaries ?? {},
    isLoading,
    refetch,
  };
}
