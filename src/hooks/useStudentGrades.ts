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
 * Fetches grades for a student.
 *
 * @param studentUserIdOrProfileId - Either the student's auth user_id or student_profiles.id
 * @param parentUserId - The parent's auth user_id (used to resolve profile IDs)
 */
async function fetchStudentGrades(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<StudentGrade[]> {
  // Resolve the student's user_id if we have a profile ID
  let studentUserId = studentUserIdOrProfileId;
  let studentProfileId = studentUserIdOrProfileId;

  if (parentUserId) {
    // Check if this is a student_profiles.id
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('id, user_id')
      .eq('id', studentUserIdOrProfileId)
      .maybeSingle();

    if (profile?.user_id) {
      studentUserId = profile.user_id;
      studentProfileId = profile.id;
    } else {
      // Maybe it's already a user_id - look up the profile by user_id
      const { data: profileByUserId } = await supabase
        .from('student_profiles')
        .select('id, user_id')
        .eq('user_id', studentUserIdOrProfileId)
        .maybeSingle();

      if (profileByUserId) {
        studentProfileId = profileByUserId.id;
      }
    }
  }

  // Try student_grades table first (uses student_user_id)
  let { data, error } = await supabase
    .from('student_grades')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching student grades:', error);
    throw error;
  }

  // If no results, try dashboard_grades (uses student_id which is profile ID)
  if (!data || data.length === 0) {
    const { data: dashboardData, error: dashError } = await supabase
      .from('dashboard_grades')
      .select('*')
      .eq('student_id', studentProfileId)
      .order('created_at', { ascending: false });

    if (!dashError && dashboardData) {
      // Map dashboard_grades to StudentGrade format
      return dashboardData.map((g) => ({
        id: g.id,
        student_user_id: studentUserId,
        subject: g.class_name,
        grade: g.grade,
        base_amount: g.base_amount,
        status: 'approved',
        submitted_at: g.created_at,
      }));
    }
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
  const targetUserId = studentUserId || user?.id || '';
  const parentUserId = user?.id;

  const { data: grades = [], isLoading, error, refetch } = useQuery({
    queryKey: studentGradesKeys.list(targetUserId),
    queryFn: () => fetchStudentGrades(targetUserId, parentUserId),
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
