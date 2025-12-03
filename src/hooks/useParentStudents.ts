import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface StudentInfo {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  grade_level: string;
  base_reward_amount: number;
  is_active: boolean;
}

// Query key factory
export const parentStudentsKeys = {
  all: ['parentStudents'] as const,
  list: (userId: string) => [...parentStudentsKeys.all, 'list', userId] as const,
};

async function fetchParentStudents(parentUserId: string): Promise<StudentInfo[]> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('id, user_id, name, email, grade_level, base_reward_amount, is_active')
    .eq('user_id', parentUserId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching parent students:', error);
    throw error;
  }

  return data || [];
}

export function useParentStudents() {
  const { user } = useAuth();

  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: parentStudentsKeys.list(user?.id || ''),
    queryFn: () => fetchParentStudents(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    students,
    isLoading,
    error,
    refetch,
    hasStudents: students.length > 0,
    studentCount: students.length,
  };
}
