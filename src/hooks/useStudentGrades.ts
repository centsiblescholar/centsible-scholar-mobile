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
  originated_by: string | null;
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
 * Returns ALL grades (for display purposes — the hook filters approved-only for calculations).
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

/**
 * Submit a grade. Behavior differs based on who is submitting:
 * - Student submits: status='pending', originated_by='student' (needs parent approval)
 * - Parent submits: status='approved', originated_by='parent' (auto-approved)
 */
async function submitGradeEntry(params: {
  student_user_id: string;
  subject: string;
  grade: string;
  base_amount: number;
  isParent: boolean;
  parent_user_id?: string;
}): Promise<void> {
  const { isParent, parent_user_id, ...gradeData } = params;

  const now = new Date().toISOString();

  if (isParent) {
    // Parent-entered grades are auto-approved
    const { error } = await supabase.from('student_grades').insert({
      ...gradeData,
      submitted_at: now,
      status: 'approved',
      originated_by: 'parent',
      reviewed_at: now,
      reviewed_by: parent_user_id ?? null,
    });
    if (error) {
      console.error('Error submitting grade:', error);
      throw error;
    }
    return;
  }

  // Student-submitted grades need parent approval
  const { error } = await supabase.from('student_grades').insert({
    ...gradeData,
    submitted_at: now,
    status: 'pending',
    originated_by: 'student',
  });

  if (error) {
    console.error('Error submitting grade:', error);
    throw error;
  }
}

export function useStudentGrades(studentUserId?: string) {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const isParent = userRole === 'parent';

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
    mutationFn: (grade: {
      student_user_id: string;
      subject: string;
      grade: string;
      base_amount: number;
    }) =>
      submitGradeEntry({
        ...grade,
        isParent,
        parent_user_id: isParent ? user?.id : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentGradesKeys.list(targetUserId) });
      // Also invalidate grade approval queries so parent sees updated list
      queryClient.invalidateQueries({ queryKey: ['gradeApproval'] });
    },
  });

  // Only APPROVED grades count toward rewards and GPA
  const approvedGrades = grades.filter((g) => g.status === 'approved');

  // Convert approved grades to GradeEntry format for calculations
  const gradeEntries: GradeEntry[] = approvedGrades.map((g) => ({
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

  // Calculate totals from approved grades only
  const totalReward = gradeEntries.reduce((sum, g) => sum + g.rewardAmount, 0);
  const gpa = calculateGPA(gradeEntries);

  return {
    grades,          // All grades (for display — includes pending/rejected)
    gradeEntries,    // Approved grades as GradeEntry (for calculations)
    totalReward,     // Sum of approved grade rewards only
    gpa,             // GPA from approved grades only
    isLoading,
    error,
    refetch,
    submitGrade: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}
