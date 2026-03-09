import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  color: string;
}

const GOAL_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
];

/** Map a Supabase row to the client SavingsGoal interface */
function mapRow(row: Record<string, unknown>, index: number): SavingsGoal {
  return {
    id: row.id as string,
    name: row.goal_name as string,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    createdAt: row.created_at as string,
    color: GOAL_COLORS[index % GOAL_COLORS.length],
  };
}

/**
 * Fetch active savings goals for a student from Supabase.
 *
 * @param studentUserId - The student's auth user ID.
 *   RLS allows both the student themselves (auth.uid() = user_id)
 *   and linked parents (via parent_student_relationships) to read.
 */
async function fetchSavingsGoals(studentUserId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', studentUserId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching savings goals:', error);
    throw error;
  }

  return (data || []).map(mapRow);
}

async function insertGoal(studentUserId: string, name: string, targetAmount: number) {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id: studentUserId,
      goal_name: name,
      target_amount: targetAmount,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating savings goal:', error);
    throw error;
  }

  return data;
}

async function updateGoalAmount(goalId: string, newAmount: number) {
  const { error } = await supabase
    .from('savings_goals')
    .update({
      current_amount: newAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating savings goal:', error);
    throw error;
  }
}

async function softDeleteGoal(goalId: string) {
  const { error } = await supabase
    .from('savings_goals')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', goalId);

  if (error) {
    console.error('Error deleting savings goal:', error);
    throw error;
  }
}

export function useSavingsGoals(studentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['savingsGoals', studentUserId];

  const {
    data: goals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSavingsGoals(studentUserId!),
    enabled: !!studentUserId,
    staleTime: 5 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: ({ name, targetAmount }: { name: string; targetAmount: number }) =>
      insertGoal(studentUserId!, name, targetAmount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      updateGoalAmount(goalId, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => softDeleteGoal(goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Public API — matches the previous interface so callers don't break

  const addGoal = async (name: string, targetAmount: number) => {
    await addMutation.mutateAsync({ name, targetAmount });
  };

  const updateGoalProgress = async (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const clamped = Math.min(amount, goal.targetAmount);
    await updateMutation.mutateAsync({ goalId, amount: clamped });
  };

  const addToGoal = async (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    await updateMutation.mutateAsync({ goalId, amount: newAmount });
  };

  const deleteGoal = async (goalId: string) => {
    await deleteMutation.mutateAsync(goalId);
  };

  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoalProgress,
    addToGoal,
    deleteGoal,
    totalSaved,
    totalTarget,
    refetch,
  };
}
