import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  grade_level: string;
  base_reward_amount: number;
  is_active: boolean;
  reporting_frequency: string;
  custom_frequency_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentInput {
  name: string;
  email: string;
  grade_level: string;
  password: string;
  base_reward_amount: number;
}

export interface UpdateStudentInput {
  name?: string;
  email?: string;
  grade_level?: string;
  base_reward_amount?: number;
  is_active?: boolean;
  reporting_frequency?: string;
}

// Query key factory
export const studentManagementKeys = {
  all: ['studentManagement'] as const,
  list: (userId: string) => [...studentManagementKeys.all, 'list', userId] as const,
  detail: (studentId: string) => [...studentManagementKeys.all, 'detail', studentId] as const,
};

// Fetch all students for a parent via parent_student_relationships
async function fetchStudents(parentUserId: string): Promise<StudentProfile[]> {
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
    .select('*')
    .in('user_id', studentUserIds)
    .order('name');

  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }

  return data || [];
}

// Fetch a single student
async function fetchStudent(studentId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching student:', error);
    throw error;
  }

  return data;
}

/**
 * Error class for student creation failures
 */
export class StudentCreationError extends Error {
  public readonly isRLSError: boolean;
  public readonly originalError: Error;

  constructor(message: string, originalError: Error, isRLSError: boolean = false) {
    super(message);
    this.name = 'StudentCreationError';
    this.originalError = originalError;
    this.isRLSError = isRLSError;
  }
}

// Create a new student via the create-student edge function
// This creates a real Supabase auth account for the student
async function createStudent(
  parentUserId: string,
  input: CreateStudentInput
): Promise<StudentProfile> {
  const { data, error } = await supabase.functions.invoke('create-student', {
    body: {
      name: input.name,
      email: input.email,
      gradeLevel: input.grade_level,
      password: input.password,
      baseRewardAmount: input.base_reward_amount,
      reportingFrequency: 'weekly',
    },
  });

  if (error) {
    console.error('Error creating student:', error);
    throw new StudentCreationError(
      'Failed to create student. Please try again.',
      error
    );
  }

  if (!data?.success) {
    const errorMsg = data?.error || 'Failed to create student';
    throw new StudentCreationError(errorMsg, new Error(errorMsg));
  }

  // The edge function returns a partial student object.
  // Return it - the mutation's onSuccess will invalidate queries to refetch full data.
  return data.student;
}

// Update a student
async function updateStudent(
  studentId: string,
  input: UpdateStudentInput
): Promise<StudentProfile> {
  const { data, error } = await supabase
    .from('student_profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating student:', error);
    throw error;
  }

  return data;
}

// Soft delete (deactivate) a student
async function deactivateStudent(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_profiles')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  if (error) {
    console.error('Error deactivating student:', error);
    throw error;
  }
}

// Reactivate a student
async function reactivateStudent(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_profiles')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  if (error) {
    console.error('Error reactivating student:', error);
    throw error;
  }
}

export function useStudentManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const parentUserId = user?.id || '';

  // Fetch all students
  const {
    data: students = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: studentManagementKeys.list(parentUserId),
    queryFn: () => fetchStudents(parentUserId),
    enabled: !!parentUserId,
    staleTime: 5 * 60 * 1000,
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateStudentInput) => createStudent(parentUserId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentManagementKeys.list(parentUserId) });
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ studentId, input }: { studentId: string; input: UpdateStudentInput }) =>
      updateStudent(studentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentManagementKeys.list(parentUserId) });
    },
  });

  // Deactivate student mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentManagementKeys.list(parentUserId) });
    },
  });

  // Reactivate student mutation
  const reactivateMutation = useMutation({
    mutationFn: reactivateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentManagementKeys.list(parentUserId) });
    },
  });

  // Filter students by active status
  const activeStudents = students.filter((s) => s.is_active);
  const inactiveStudents = students.filter((s) => !s.is_active);

  return {
    // Data
    students,
    activeStudents,
    inactiveStudents,
    studentCount: students.length,
    activeCount: activeStudents.length,

    // Loading/error states
    isLoading,
    error,
    refetch,

    // Mutations
    createStudent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateStudent: (studentId: string, input: UpdateStudentInput) =>
      updateMutation.mutateAsync({ studentId, input }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deactivateStudent: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,

    reactivateStudent: reactivateMutation.mutateAsync,
    isReactivating: reactivateMutation.isPending,
  };
}

// Hook to fetch a single student's details
export function useStudentDetail(studentId: string | undefined) {
  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: studentManagementKeys.detail(studentId || ''),
    queryFn: () => fetchStudent(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    student,
    isLoading,
    error,
    refetch,
  };
}
