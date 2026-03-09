import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { GradeEntry, Grade } from '../shared/types';
import { calculateGradeReward, calculateGPA } from '../shared/calculations';

export interface StudentGrade {
  id: string;
  student_user_id: string;
  subject: string;
  grade: string;
  base_amount: number;
  status: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  parent_notes?: string | null;
}

// Query key factory
export const studentGradesKeys = {
  all: ['studentGrades'] as const,
  list: (userId: string) => [...studentGradesKeys.all, 'list', userId] as const,
};

/**
 * Fetches grades for a student from the student_grades table.
 *
 * @param studentUserId - The student's auth user_id (from student_profiles.user_id)
 *
 * Note: dashboard_grades is a legacy table with no parent RLS policy.
 * All grade data should go through student_grades which has proper
 * parent access via parent_student_relationships.
 */
async function fetchStudentGrades(
  studentUserId: string
): Promise<StudentGrade[]> {
  const { data, error } = await supabase
    .from('student_grades')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching student grades:', error);
    throw error;
  }

  return data || [];
}

async function submitGrade(grade: {
  student_user_id: string;
  subject: string;
  grade: string;
  base_amount: number;
}): Promise<void> {
  const { error } = await supabase.from('student_grades').insert({
    ...grade,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error submitting grade:', error);
    throw error;
  }
}

export function useStudentGrades(studentUserId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use provided studentUserId or fall back to logged-in user's ID
  // When called from a parent view, studentUserId should be selectedStudent.user_id
  const targetUserId = studentUserId || user?.id || '';

  const { data: grades = [], isLoading, error, refetch } = useQuery({
    queryKey: studentGradesKeys.list(targetUserId),
    queryFn: () => fetchStudentGrades(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const submitMutation = useMutation({
    mutationFn: submitGrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentGradesKeys.list(targetUserId) });
    },
  });

  // Convert to GradeEntry format for calculations
  const gradeEntries: GradeEntry[] = grades.map((g) => ({
    id: g.id,
    className: g.subject,
    grade: g.grade as Grade,
    baseAmount: g.base_amount,
    rewardAmount: calculateGradeReward({
      id: g.id,
      className: g.subject,
      grade: g.grade as Grade,
      baseAmount: g.base_amount,
      rewardAmount: 0,
    }),
  }));

  // Calculate totals
  const totalReward = gradeEntries.reduce((sum, g) => sum + g.rewardAmount, 0);
  const gpa = calculateGPA(gradeEntries);

  return {
    grades,
    gradeEntries,
    totalReward,
    gpa,
    isLoading,
    error,
    refetch,
    submitGrade: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}
