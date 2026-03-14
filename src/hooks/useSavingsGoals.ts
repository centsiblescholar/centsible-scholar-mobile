import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  completedAt: string | null;
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

/** Common emoji options grouped by category for the emoji picker */
export const GOAL_EMOJIS = {
  Shopping: ['🎮', '👟', '📱', '🎧', '👗'],
  Activities: ['⚽', '🎨', '🎵', '🏄', '🎪'],
  Food: ['🍕', '🍦', '🧁', '☕', '🌮'],
  Travel: ['✈️', '🏖️', '🎢', '🚗', '🏕️'],
  Animals: ['🐶', '🐱', '🐴', '🐠', '🦋'],
  Goals: ['🎯', '💰', '⭐', '🏆', '💎'],
};

/** Map a Supabase row to the client SavingsGoal interface */
function mapRow(row: Record<string, unknown>, index: number): SavingsGoal {
  return {
    id: row.id as string,
    name: row.goal_name as string,
    emoji: (row.goal_emoji as string) || '🎯',
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) || null,
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

async function fetchCompletedGoals(studentUserId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', studentUserId)
    .eq('is_active', false)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching completed goals:', error);
    throw error;
  }

  return (data || []).map(mapRow);
}

async function insertGoal(
  studentUserId: string,
  name: string,
  targetAmount: number,
  emoji: string,
) {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id: studentUserId,
      goal_name: name,
      target_amount: targetAmount,
      goal_emoji: emoji,
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

async function completeGoalInDB(goalId: string) {
  const { error } = await supabase
    .from('savings_goals')
    .update({
      is_active: false,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error completing savings goal:', error);
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
  const completedQueryKey = ['savingsGoals', studentUserId, 'completed'];

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

  const {
    data: completedGoals = [],
    isLoading: isLoadingCompleted,
    refetch: refetchCompleted,
  } = useQuery({
    queryKey: completedQueryKey,
    queryFn: () => fetchCompletedGoals(studentUserId!),
    enabled: !!studentUserId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: completedQueryKey });
  };

  const addMutation = useMutation({
    mutationFn: ({
      name,
      targetAmount,
      emoji,
    }: {
      name: string;
      targetAmount: number;
      emoji: string;
    }) => insertGoal(studentUserId!, name, targetAmount, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      updateGoalAmount(goalId, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const completeMutation = useMutation({
    mutationFn: (goalId: string) => completeGoalInDB(goalId),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => softDeleteGoal(goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Public API — backwards compatible + new features

  const addGoal = async (name: string, targetAmount: number, emoji = '🎯') => {
    await addMutation.mutateAsync({ name, targetAmount, emoji });
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

  const completeGoal = async (goalId: string) => {
    await completeMutation.mutateAsync(goalId);
  };

  const deleteGoal = async (goalId: string) => {
    await deleteMutation.mutateAsync(goalId);
  };

  /**
   * Allocate a total amount evenly across the specified goals.
   * Each goal receives totalAmount / goalIds.length, capped at its remaining target.
   */
  const allocateSavings = async (totalAmount: number, goalIds: string[]) => {
    if (goalIds.length === 0) return;
    const perGoal = totalAmount / goalIds.length;

    const updates = goalIds
      .map((gid) => {
        const goal = goals.find((g) => g.id === gid);
        if (!goal) return null;
        const remaining = goal.targetAmount - goal.currentAmount;
        const addition = Math.min(perGoal, remaining);
        if (addition <= 0) return null;
        return { goalId: gid, amount: goal.currentAmount + addition };
      })
      .filter(Boolean) as { goalId: string; amount: number }[];

    // Run updates sequentially to avoid race conditions
    for (const update of updates) {
      await updateMutation.mutateAsync(update);
    }
  };

  /**
   * Move funds from one goal to another.
   */
  const moveFunds = async (fromGoalId: string, toGoalId: string, amount: number) => {
    const fromGoal = goals.find((g) => g.id === fromGoalId);
    const toGoal = goals.find((g) => g.id === toGoalId);
    if (!fromGoal || !toGoal || amount <= 0) return;

    const actualAmount = Math.min(amount, fromGoal.currentAmount);
    const toRemaining = toGoal.targetAmount - toGoal.currentAmount;
    const transferAmount = Math.min(actualAmount, toRemaining);

    if (transferAmount <= 0) return;

    await updateMutation.mutateAsync({
      goalId: fromGoalId,
      amount: fromGoal.currentAmount - transferAmount,
    });
    await updateMutation.mutateAsync({
      goalId: toGoalId,
      amount: toGoal.currentAmount + transferAmount,
    });
  };

  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return {
    goals,
    completedGoals,
    isLoading,
    isLoadingCompleted,
    error,
    addGoal,
    updateGoalProgress,
    addToGoal,
    completeGoal,
    deleteGoal,
    allocateSavings,
    moveFunds,
    totalSaved,
    totalTarget,
    refetch,
    refetchCompleted,
  };
}
