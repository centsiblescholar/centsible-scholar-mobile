import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

async function fetchExternalSavings(studentUserId: string): Promise<number> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('external_savings')
    .eq('user_id', studentUserId)
    .single();

  if (error) {
    console.error('Error fetching external savings:', error);
    throw error;
  }

  return Number(data?.external_savings ?? 0);
}

async function updateExternalSavingsInDB(studentUserId: string, amount: number): Promise<void> {
  const { error } = await supabase
    .from('student_profiles')
    .update({ external_savings: amount })
    .eq('user_id', studentUserId);

  if (error) {
    console.error('Error updating external savings:', error);
    throw error;
  }
}

/**
 * Hook for managing a student's external savings (money from outside the app).
 *
 * External savings are stored on `student_profiles.external_savings`.
 * RLS allows both the student and linked parents to read.
 * Updates require matching user_id (student self-update) or parent relationship.
 */
export function useExternalSavings(studentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['externalSavings', studentUserId];

  const {
    data: externalSavings = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchExternalSavings(studentUserId!),
    enabled: !!studentUserId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (amount: number) => updateExternalSavingsInDB(studentUserId!, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateExternalSavings = async (amount: number) => {
    await updateMutation.mutateAsync(amount);
  };

  return {
    externalSavings,
    updateExternalSavings,
    isLoading,
    isSaving: updateMutation.isPending,
    error,
    refetch,
  };
}
