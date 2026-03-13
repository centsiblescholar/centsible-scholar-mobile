import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface PendingGrade {
  id: string;
  student_user_id: string;
  student_display_name: string;
  subject: string;
  grade: string;
  base_amount: number;
  status: string;
  originated_by: string | null;
  submitted_at: string;
  parent_notes: string | null;
}

export interface ReviewedGrade {
  id: string;
  student_user_id: string;
  subject: string;
  grade: string;
  base_amount: number;
  status: string;
  originated_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  parent_notes: string | null;
  student_name: string;
}

// Query key factory
export const gradeApprovalKeys = {
  all: ['gradeApproval'] as const,
  pending: (parentId: string) => [...gradeApprovalKeys.all, 'pending', parentId] as const,
  history: (parentId: string) => [...gradeApprovalKeys.all, 'history', parentId] as const,
};

/**
 * Fetch pending grades directly from student_grades, scoped to the parent's students.
 */
async function fetchPendingGrades(parentId: string): Promise<PendingGrade[]> {
  // Get parent's linked students
  const { data: relationships, error: relError } = await supabase
    .from('parent_student_relationships')
    .select('student_user_id')
    .eq('parent_user_id', parentId);

  if (relError) throw relError;
  if (!relationships || relationships.length === 0) return [];

  const studentUserIds = relationships.map((r) => r.student_user_id);

  // Get student names
  const { data: students, error: studentsError } = await supabase
    .from('student_profiles')
    .select('user_id, name')
    .in('user_id', studentUserIds);

  if (studentsError) throw studentsError;

  const studentMap = new Map((students || []).map((s) => [s.user_id, s.name]));

  // Fetch pending grades from student_grades
  const { data, error } = await supabase
    .from('student_grades')
    .select('*')
    .in('student_user_id', studentUserIds)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending grades:', error);
    throw error;
  }

  return (data || []).map((g) => ({
    id: g.id,
    student_user_id: g.student_user_id,
    student_display_name: studentMap.get(g.student_user_id) || 'Unknown',
    subject: g.subject,
    grade: g.grade,
    base_amount: g.base_amount ?? 0,
    status: g.status ?? 'pending',
    originated_by: g.originated_by,
    submitted_at: g.submitted_at ?? '',
    parent_notes: g.parent_notes,
  }));
}

/**
 * Fetch recently reviewed grades (approved/rejected/needs_revision from last 30 days).
 */
async function fetchReviewedGrades(parentId: string): Promise<ReviewedGrade[]> {
  // Get parent's students
  const { data: relationships, error: relError } = await supabase
    .from('parent_student_relationships')
    .select('student_user_id')
    .eq('parent_user_id', parentId);

  if (relError) throw relError;
  if (!relationships || relationships.length === 0) return [];

  const studentUserIds = relationships.map((r) => r.student_user_id);

  // Get student names
  const { data: students, error: studentsError } = await supabase
    .from('student_profiles')
    .select('user_id, name')
    .in('user_id', studentUserIds)
    .eq('is_active', true);

  if (studentsError) throw studentsError;
  if (!students || students.length === 0) return [];

  const activeStudentIds = students.map((s) => s.user_id);

  // Fetch recently reviewed grades (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: grades, error: gradesError } = await supabase
    .from('student_grades')
    .select('*')
    .in('student_user_id', activeStudentIds)
    .in('status', ['approved', 'rejected', 'needs_revision'])
    .gte('reviewed_at', thirtyDaysAgo.toISOString())
    .order('reviewed_at', { ascending: false })
    .limit(50);

  if (gradesError) throw gradesError;

  const studentMap = new Map(students.map((s) => [s.user_id, s.name]));

  return (grades || []).map((grade) => ({
    ...grade,
    student_name: studentMap.get(grade.student_user_id) || 'Unknown',
  }));
}

/**
 * Approve a grade using the approve_student_grade RPC.
 */
async function approveGrade(
  gradeId: string,
  parentId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase.rpc('approve_student_grade', {
    grade_id: gradeId,
    parent_user_id: parentId,
    ...(notes ? { parent_notes: notes } : {}),
  });

  if (error) {
    console.error('Error approving grade:', error);
    throw error;
  }
}

/**
 * Reject a grade using the reject_student_grade RPC.
 */
async function rejectGrade(
  gradeId: string,
  parentId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase.rpc('reject_student_grade', {
    grade_id: gradeId,
    parent_user_id: parentId,
    ...(notes ? { parent_notes: notes } : {}),
  });

  if (error) {
    console.error('Error rejecting grade:', error);
    throw error;
  }
}

/**
 * Request revision of a grade using the request_grade_revision RPC.
 */
async function requestRevision(
  gradeId: string,
  parentId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase.rpc('request_grade_revision', {
    grade_id: gradeId,
    parent_user_id: parentId,
    parent_notes: notes,
  });

  if (error) {
    console.error('Error requesting revision:', error);
    throw error;
  }
}

/**
 * Bulk approve multiple grades by calling the RPC for each.
 */
async function bulkApproveGrades(
  gradeIds: string[],
  parentId: string
): Promise<void> {
  const results = await Promise.allSettled(
    gradeIds.map((id) => approveGrade(id, parentId))
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`${failures.length}/${gradeIds.length} bulk approvals failed`);
    throw new Error(`Failed to approve ${failures.length} grade(s)`);
  }
}

export function useGradeApproval() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const parentId = user?.id || '';

  // Fetch pending grades from student_grades
  const {
    data: pendingGrades = [],
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: gradeApprovalKeys.pending(parentId),
    queryFn: () => fetchPendingGrades(parentId),
    enabled: !!parentId,
    staleTime: 2 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.pending(parentId) });
    queryClient.invalidateQueries({ queryKey: gradeApprovalKeys.history(parentId) });
    // Also invalidate student grades so dashboards update
    queryClient.invalidateQueries({ queryKey: ['studentGrades'] });
    queryClient.invalidateQueries({ queryKey: ['familyStats'] });
  };

  // Approve mutation (via RPC)
  const approveMutation = useMutation({
    mutationFn: ({ gradeId, notes }: { gradeId: string; notes?: string }) =>
      approveGrade(gradeId, parentId, notes),
    onSuccess: invalidateAll,
  });

  // Reject mutation (via RPC)
  const rejectMutation = useMutation({
    mutationFn: ({ gradeId, notes }: { gradeId: string; notes?: string }) =>
      rejectGrade(gradeId, parentId, notes),
    onSuccess: invalidateAll,
  });

  // Request revision mutation (via RPC)
  const revisionMutation = useMutation({
    mutationFn: ({ gradeId, notes }: { gradeId: string; notes: string }) =>
      requestRevision(gradeId, parentId, notes),
    onSuccess: invalidateAll,
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (gradeIds: string[]) => bulkApproveGrades(gradeIds, parentId),
    onSuccess: invalidateAll,
  });

  // Group pending grades by student
  const pendingByStudent = pendingGrades.reduce<Record<string, PendingGrade[]>>(
    (acc, grade) => {
      const studentName = grade.student_display_name;
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
    revisionCount: reviewedGrades.filter((g) => g.status === 'needs_revision').length,
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

    // Actions (all via RPCs)
    approveGrade: (gradeId: string, notes?: string) =>
      approveMutation.mutateAsync({ gradeId, notes }),
    rejectGrade: (gradeId: string, notes?: string) =>
      rejectMutation.mutateAsync({ gradeId, notes }),
    requestRevision: (gradeId: string, notes: string) =>
      revisionMutation.mutateAsync({ gradeId, notes }),
    bulkApproveGrades: bulkApproveMutation.mutateAsync,

    // Action states
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isRequestingRevision: revisionMutation.isPending,
    isBulkApproving: bulkApproveMutation.isPending,

    // Refetch
    refetch,
  };
}
