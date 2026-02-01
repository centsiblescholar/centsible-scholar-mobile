import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface StudentInfo {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
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
  // First get student user IDs from parent_student_relationships
  const { data: relationships, error: relError } = await supabase
    .from('parent_student_relationships')
    .select('student_user_id')
    .eq('parent_user_id', parentUserId);

  if (relError) {
    console.error('Error fetching parent-student relationships:', relError);
    throw relError;
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  const studentUserIds = relationships.map((r) => r.student_user_id);

  // Now fetch student profiles for those user IDs
  const { data, error } = await supabase
    .from('student_profiles')
    .select('id, user_id, name, email, grade_level, base_reward_amount, is_active')
    .in('user_id', studentUserIds)
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
