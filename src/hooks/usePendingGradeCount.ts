import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

/**
 * Lightweight hook that returns just the count of pending grades for the current parent.
 * Used for the tab bar badge — avoids loading full grade data.
 */
export function usePendingGradeCount() {
  const { user, userRole } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ['gradeApproval', 'pendingCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get parent's linked students
      const { data: relationships, error: relError } = await supabase
        .from('parent_student_relationships')
        .select('student_user_id')
        .eq('parent_user_id', user.id);

      if (relError || !relationships?.length) return 0;

      const studentUserIds = relationships.map((r) => r.student_user_id);

      const { count: gradeCount, error } = await supabase
        .from('student_grades')
        .select('*', { count: 'exact', head: true })
        .in('student_user_id', studentUserIds)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      return gradeCount ?? 0;
    },
    enabled: !!user && userRole === 'parent',
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  return count;
}
