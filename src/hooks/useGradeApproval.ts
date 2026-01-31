import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface PendingGrade {
  id: string;
  student_user_id: string;
  student_name: string;
  subject: string;
  grade: string;
  base_amount: number;
  status: string;
  submitted_at: string;
  parent_notes: string | null;
}

export interface GradeWithStudent {
  id: string;
  student_user_id: string;
  subject: string;
  grade: string;
  base_amount: number;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  parent_notes: string | null;
  student_profiles: {
    name: string;
  } | null;
}

// Query key factory
export const gradeApprovalKeys = {
  all: ['gradeApproval'] as const,
  pending: (parentId: string) => [...gradeApprovalKeys.all, 'pending', parentId] as const,
  history: (parentId: string) => [...gradeApprovalKeys.all, 'history', parentId] as const,
};

// Fetch pending grades for all students of a parent
async function fetchPendingGrades(parentId: string): Promise<PendingGrade[]> {
  // First get all students belonging to this parent
  const { data: students, error: studentsError } = await supabase
    .from('student_profiles')
    .select('user_id, name')
    .eq('user_id', parentId)
    .eq('is_active', true);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    throw studentsError;
  }

  if (!students || students.length === 0) {
    return [];
  }

  // Get all student IDs
  const studentIds = students.map((s) => s.user_id);

  // Fetch pending grades for these students
  const { data: grades, error: gradesError } = await supabase
    .from('student_grades')
    .select('*')
    .in('student_user_id', studentIds)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (gradesError) {
    console.error('Error fetching pending grades:', gradesError);
    throw gradesError;
  }

  // Map grades with student names
  const studentMap = new Map(students.map((s) => [s.user_id, s.name]));

  return (grades || []).map((grade) => ({
    ...grade,
    student_name: studentMap.get(grade.student_user_id) || 'Unknown',
  }));
}

// Fetch recently reviewed grades
async function fetchReviewedGrades(parentId: string): Promise<PendingGrade[]> {
  // First get all students belonging to this parent
  const { data: students, error: studentsError } = await supabase
    .from('student_profiles')
    .select('user_id, name')
    .eq('user_id', parentId)
    .eq('is_active', true);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    throw studentsError;
  }

  if (!students || students.length === 0) {
    return [];
  }

  const studentIds = students.map((s) => s.user_id);

  // Fetch recently reviewed grades (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: grades, error: gradesError } = await supabase
    .from('student_grades')
    .select('*')
    .in('student_user_id', studentIds)
    .in('status', ['approved', 'rejected'])
    .gte('reviewed_at', thirtyDaysAgo.toISOString())
    .order('reviewed_at', { ascending: false })
    .limit(50);

  if (gradesError) {
    console.error('Error fetching reviewed grades:', gradesError);
    throw gradesError;
  }

  const studentMap = new Map(students.map((s) => [s.user_id, s.name]));

  return (grades || []).map((grade) => ({
    ...grade,
    student_name: studentMap.get(grade.student_user_id) || 'Unknown',
  }));
}

// Approve a grade
async function approveGrade(
  gradeId: string,
  parentId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('student_grades')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: parentId,
      parent_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gradeId);

  if (error) {
    console.error('Error approving grade:', error);
    throw error;
  }
}

// Reject a grade
async function rejectGrade(
  gradeId: string,
  parentId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('student_grades')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: parentId,
      parent_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gradeId);

  if (error) {
    console.error('Error rejecting grade:', error);
    throw error;
  }
}

// Bulk approve grades
async function bulkApproveGrades(
  gradeIds: string[],
  parentId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_grades')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: parentId,
      updated_at: new Date().toISOString(),
    })
    .in('id', gradeIds);

  if (error) {
    console.error('Error bulk approving grades:', error);
    throw error;
  }
}

export function useGradeApproval() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const parentId = user?.id || '';

  // Fetch pending grades
  const {
    data: pendingGrades = [],
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: gradeApprovalKeys.pending(parentId),
    queryFn: () => fetchPendingGrades(parentId),
    enabled: !!parentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch recently reviewed grades
  const {
    data: reviewedGrades = [],
    isLoading: reviewedLoading,
    error: reviewedError,
    refetch: refetchReviewed,
  } = useQuery({
    queryKey: gradeApprovalKeys.history(parentId),
    queryFn: () => fetchReviewedGrades(parentId),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ gradeId, notes }: { gradeId: string; notes?: string }) =>
      approveGrade(gradeId, parentId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.pending(parentId) });
      queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.history(parentId) });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ gradeId, notes }: { gradeId: string; notes?: string }) =>
      rejectGrade(gradeId, parentId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.pending(parentId) });
      queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.history(parentId) });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (gradeIds: string[]) => bulkApproveGrades(gradeIds, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.pending(parentId) });
      queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.history(parentId) });
    },
  });

  // Group pending grades by student
  const pendingByStudent = pendingGrades.reduce<Record<string, PendingGrade[]>>(
    (acc, grade) => {
      const studentName = grade.student_name;
      if (!acc[studentName]) {
        acc[studentName] = [];
      }
      acc[studentName].push(grade);
      return acc;
    },
    {}
  );

  // Calculate statistics
  const stats = {
    pendingCount: pendingGrades.length,
    approvedCount: reviewedGrades.filter((g) => g.status === 'approved').length,
    rejectedCount: reviewedGrades.filter((g) => g.status === 'rejected').length,
    studentCount: Object.keys(pendingByStudent).length,
  };

  // Refetch all data
  const refetch = async () => {
    await Promise.all([refetchPending(), refetchReviewed()]);
  };

  return {
    // Data
    pendingGrades,
    reviewedGrades,
    pendingByStudent,
    stats,

    // Loading states
    isLoading: pendingLoading || reviewedLoading,
    pendingLoading,
    reviewedLoading,

    // Errors
    pendingError,
    reviewedError,

    // Actions
    approveGrade: (gradeId: string, notes?: string) =>
      approveMutation.mutateAsync({ gradeId, notes }),
    rejectGrade: (gradeId: string, notes?: string) =>
      rejectMutation.mutateAsync({ gradeId, notes }),
    bulkApproveGrades: bulkApproveMutation.mutateAsync,

    // Action states
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isBulkApproving: bulkApproveMutation.isPending,

    // Refetch
    refetch,
  };
}
