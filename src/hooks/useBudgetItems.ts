import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

export interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  isRecurring: boolean;
}

interface BudgetItemRow {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    isRecurring: row.is_recurring,
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function fetchBudgetItems(userId: string): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching budget items:', error);
    throw error;
  }

  return (data || []).map((row) => mapRow(row as unknown as BudgetItemRow));
}

async function saveBudgetItemsToDB(userId: string, items: BudgetItem[]) {
  // Delete all existing items for this user
  const { error: deleteError } = await supabase
    .from('budget_items')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting budget items:', deleteError);
    throw deleteError;
  }

  // Insert all current items
  if (items.length > 0) {
    const rows = items.map((item) => ({
      user_id: userId,
      category: item.category,
      amount: item.amount,
      is_recurring: item.isRecurring,
    }));

    const { error: insertError } = await supabase
      .from('budget_items')
      .insert(rows);

    if (insertError) {
      console.error('Error inserting budget items:', insertError);
      throw insertError;
    }
  }
}

/**
 * Hook for managing budget items (spending plan).
 *
 * Budget items are managed locally until explicitly saved to the database
 * via `saveBudget()`. This follows the web app's pattern where items are
 * added/removed in-memory and then bulk-saved.
 *
 * RLS: budget_items only allows auth.uid() = user_id (student self-access).
 * Parents cannot read or modify budget items.
 */
export function useBudgetItems(studentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['budgetItems', studentUserId];

  const {
    data: savedItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchBudgetItems(studentUserId!),
    enabled: !!studentUserId,
    staleTime: 5 * 60 * 1000,
  });

  // Local state for in-progress edits (not yet saved to DB)
  const [localItems, setLocalItems] = useState<BudgetItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync local state when saved items load or change
  useEffect(() => {
    if (savedItems.length > 0 || (!isLoading && !isInitialized)) {
      setLocalItems(savedItems);
      setIsInitialized(true);
    }
  }, [savedItems, isLoading, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: () => saveBudgetItemsToDB(studentUserId!, localItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addItem = useCallback((category: string, amount: number, isRecurring = false) => {
    const newItem: BudgetItem = {
      id: generateId(),
      category,
      amount,
      isRecurring,
    };
    setLocalItems((prev) => [newItem, ...prev]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setLocalItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetToSaved = useCallback(() => {
    setLocalItems(savedItems);
  }, [savedItems]);

  const saveBudget = useCallback(async () => {
    await saveMutation.mutateAsync();
  }, [saveMutation]);

  const hasUnsavedChanges = useMemo(() => {
    if (localItems.length !== savedItems.length) return true;
    // Compare by category + amount + isRecurring (order may differ)
    const localKey = localItems
      .map((i) => `${i.category}|${i.amount}|${i.isRecurring}`)
      .sort()
      .join(',');
    const savedKey = savedItems
      .map((i) => `${i.category}|${i.amount}|${i.isRecurring}`)
      .sort()
      .join(',');
    return localKey !== savedKey;
  }, [localItems, savedItems]);

  const totalBudgeted = useMemo(
    () => localItems.reduce((sum, item) => sum + item.amount, 0),
    [localItems],
  );

  return {
    items: localItems,
    savedItems,
    hasUnsavedChanges,
    totalBudgeted,
    addItem,
    removeItem,
    saveBudget,
    resetToSaved,
    isLoading,
    isSaving: saveMutation.isPending,
    error,
    refetch,
  };
}
