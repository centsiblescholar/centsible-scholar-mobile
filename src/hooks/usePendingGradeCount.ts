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
      const { count, error } = await supabase
        .from('parent_pending_grades')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    enabled: !!user && userRole === 'parent',
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  return count;
}
