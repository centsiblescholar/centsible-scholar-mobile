import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  color: string;
}

const STORAGE_KEY = 'savings_goals';

const GOAL_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
];

export function useSavingsGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `${STORAGE_KEY}_${userId}`;

  // Load goals from storage
  const loadGoals = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading savings goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, userId]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Save goals to storage
  const saveGoals = async (updatedGoals: SavingsGoal[]) => {
    if (!userId) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error saving goals:', error);
      throw error;
    }
  };

  // Add a new goal
  const addGoal = async (name: string, targetAmount: number) => {
    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      name,
      targetAmount,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
    };

    await saveGoals([...goals, newGoal]);
    return newGoal;
  };

  // Update goal progress
  const updateGoalProgress = async (goalId: string, amount: number) => {
    const updatedGoals = goals.map((goal) =>
      goal.id === goalId
        ? { ...goal, currentAmount: Math.min(amount, goal.targetAmount) }
        : goal
    );
    await saveGoals(updatedGoals);
  };

  // Add to goal
  const addToGoal = async (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    await updateGoalProgress(goalId, newAmount);
  };

  // Delete a goal
  const deleteGoal = async (goalId: string) => {
    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    await saveGoals(updatedGoals);
  };

  // Calculate totals
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return {
    goals,
    isLoading,
    addGoal,
    updateGoalProgress,
    addToGoal,
    deleteGoal,
    totalSaved,
    totalTarget,
    refetch: loadGoals,
  };
}
