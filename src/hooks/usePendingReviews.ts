import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { BehaviorAssessment } from '../shared/types';
import { Alert } from 'react-native';

// Query key factory
export const pendingReviewKeys = {
  all: ['pendingReviews'] as const,
  list: () => [...pendingReviewKeys.all, 'list'] as const,
};

/**
 * Fetch pending behavior assessments from the parent_pending_assessments view.
 * This view is RLS-protected and only returns assessments for the logged-in parent's students.
 */
async function fetchPendingReviewsData(): Promise<BehaviorAssessment[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Please sign in to view pending reviews.');
  }

  const { data, error } = await supabase
    .from('parent_pending_assessments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Transform to match BehaviorAssessment shape with student display info
  return data.map((row: Record<string, unknown>) => {
    const displayName = (row.student_display_name as string) || 'Student';
    const nameParts = displayName.split(' ');
    return {
      ...row,
      user: {
        id: row.student_user_id as string,
        first_name: nameParts[0] || 'Student',
        last_name: nameParts.slice(1).join(' ') || '',
        email: '',
        avatar_url: undefined,
        created_at: '',
        updated_at: '',
      },
    } as BehaviorAssessment;
  });
}

export function usePendingReviews() {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: pendingReviews = [],
    isLoading: loading,
    refetch: fetchPendingReviews,
  } = useQuery({
    queryKey: pendingReviewKeys.list(),
    queryFn: fetchPendingReviewsData,
    staleTime: 30 * 1000, // 30s — reviews should be fresh
    gcTime: 5 * 60 * 1000,
  });

  /**
   * Approve or request revision via the existing Supabase RPCs.
   */
  const reviewAssessment = async (
    assessmentId: string,
    action: 'approve' | 'request_revision',
    parentNotes?: string,
  ) => {
    try {
      setReviewingId(assessmentId);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please sign in to review assessments.');
        return;
      }

      if (action === 'approve') {
        const rpcParams = {
          assessment_id: assessmentId,
          parent_user_id: user.id,
          ...(parentNotes ? { parent_notes: parentNotes } : {}),
        };
        const { error } = await supabase.rpc('approve_behavior_assessment', rpcParams);
        if (error) {
          Alert.alert('Error', 'Failed to approve: ' + error.message);
          return;
        }
      } else {
        const rpcParams = {
          assessment_id: assessmentId,
          parent_user_id: user.id,
          parent_notes: parentNotes || '',
        };
        const { error } = await supabase.rpc('request_behavior_assessment_revision', rpcParams);
        if (error) {
          Alert.alert('Error', 'Failed to request revision: ' + error.message);
          return;
        }
      }

      // Refresh
      queryClient.invalidateQueries({ queryKey: pendingReviewKeys.all });
    } catch (err) {
      console.error('Error in reviewAssessment:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setReviewingId(null);
    }
  };

  const deleteAssessment = async (assessmentId: string) => {
    try {
      setDeletingId(assessmentId);

      // Delete from parent_pending_assessments first, then behavior_assessments
      const { error: pendingError } = await supabase
        .from('parent_pending_assessments')
        .delete()
        .eq('id', assessmentId);

      if (pendingError) {
        Alert.alert('Error', 'Failed to delete: ' + pendingError.message);
        return;
      }

      const { error } = await supabase
        .from('behavior_assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) {
        Alert.alert('Error', 'Failed to delete: ' + error.message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: pendingReviewKeys.all });
    } catch (err) {
      console.error('Error in deleteAssessment:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setDeletingId(null);
    }
  };

  return {
    pendingReviews,
    loading,
    reviewingId,
    deletingId,
    fetchPendingReviews,
    reviewAssessment,
    deleteAssessment,
  };
}
