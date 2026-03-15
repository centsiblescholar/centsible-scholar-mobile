/**
 * Hook to detect grade conflicts between parent and student submissions
 * Uses the get_grade_conflicts RPC function on Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

export interface GradeConflict {
  subject: string;
  student_grade_id: string;
  student_grade: string;
  student_originated_by: string;
  parent_grade_id: string;
  parent_grade: string;
  parent_originated_by: string;
}

export function useGradeConflicts(studentUserId?: string) {
  const {
    data: conflicts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['grade-conflicts', studentUserId],
    queryFn: async (): Promise<GradeConflict[]> => {
      if (!studentUserId) return [];

      const { data, error } = await supabase.rpc('get_grade_conflicts', {
        p_student_user_id: studentUserId,
      });

      if (error) {
        console.error('Error fetching grade conflicts:', error);
        throw error;
      }

      return (data ?? []) as GradeConflict[];
    },
    enabled: !!studentUserId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const getConflictForGrade = (gradeId: string): GradeConflict | undefined => {
    return conflicts.find(
      c => c.student_grade_id === gradeId || c.parent_grade_id === gradeId,
    );
  };

  return {
    conflicts,
    conflictCount: conflicts.length,
    isLoading,
    error,
    refetch,
    getConflictForGrade,
  };
}
