import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { isAfter, parseISO } from 'date-fns';

export interface FamilyMeeting {
  id: string;
  user_id: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes: string | null;
  attendees: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface MeetingAssessment {
  id: string;
  meetingId: string;
  studentId: string;
  studentName: string;
  ratings: {
    participation: number;
    goalProgress: number;
    communication: number;
    overall: number;
  };
  notes: string | null;
  createdAt: string;
}

// Database row types (snake_case from Supabase)
interface FamilyMeetingRow {
  id: string;
  user_id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  attendees: string[] | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface MeetingAssessmentRow {
  id: string;
  meeting_id: string;
  student_id: string;
  student_name: string;
  participation_rating: number;
  goal_progress_rating: number;
  communication_rating: number;
  overall_rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Query key factory
export const familyMeetingsKeys = {
  all: ['familyMeetings'] as const,
  list: (userId: string) => [...familyMeetingsKeys.all, 'list', userId] as const,
  assessments: (userId: string) => [...familyMeetingsKeys.all, 'assessments', userId] as const,
};

// Transform database row to app type
function transformMeeting(row: FamilyMeetingRow): FamilyMeeting {
  return {
    id: row.id,
    user_id: row.user_id,
    scheduledDate: row.scheduled_date,
    status: row.status as FamilyMeeting['status'],
    notes: row.notes,
    attendees: row.attendees || [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function transformAssessment(row: MeetingAssessmentRow): MeetingAssessment {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    studentId: row.student_id,
    studentName: row.student_name,
    ratings: {
      participation: row.participation_rating,
      goalProgress: row.goal_progress_rating,
      communication: row.communication_rating,
      overall: row.overall_rating,
    },
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// Fetch all meetings for a user
async function fetchMeetings(userId: string): Promise<FamilyMeeting[]> {
  // First, try to update any missed meetings
  try {
    await supabase.rpc('update_missed_meetings');
  } catch {
    // Function may not exist yet, continue without it
  }

  const { data, error } = await supabase
    .from('family_meetings')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: false });

  if (error) {
    console.error('Error fetching family meetings:', error);
    throw error;
  }

  return (data || []).map(transformMeeting);
}

// Fetch all assessments for a user's meetings
async function fetchAssessments(userId: string): Promise<MeetingAssessment[]> {
  const { data, error } = await supabase
    .from('meeting_assessments')
    .select(`
      *,
      family_meetings!inner(user_id)
    `)
    .eq('family_meetings.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching meeting assessments:', error);
    throw error;
  }

  return (data || []).map(transformAssessment);
}

// Schedule a new meeting
async function createMeeting(
  userId: string,
  scheduledDate: Date,
  notes?: string
): Promise<FamilyMeeting> {
  const { data, error } = await supabase
    .from('family_meetings')
    .insert({
      user_id: userId,
      scheduled_date: scheduledDate.toISOString(),
      status: 'scheduled',
      notes: notes || null,
      attendees: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }

  return transformMeeting(data);
}

// Complete a meeting
async function completeMeetingFn(
  meetingId: string,
  attendees?: string[]
): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      attendees: attendees || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) {
    console.error('Error completing meeting:', error);
    throw error;
  }
}

// Cancel a meeting
async function cancelMeetingFn(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('family_meetings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) {
    console.error('Error cancelling meeting:', error);
    throw error;
  }
}

// Add a meeting assessment
async function createAssessment(
  meetingId: string,
  studentId: string,
  studentName: string,
  ratings: MeetingAssessment['ratings'],
  notes?: string
): Promise<MeetingAssessment> {
  const { data, error } = await supabase
    .from('meeting_assessments')
    .insert({
      meeting_id: meetingId,
      student_id: studentId,
      student_name: studentName,
      participation_rating: ratings.participation,
      goal_progress_rating: ratings.goalProgress,
      communication_rating: ratings.communication,
      overall_rating: ratings.overall,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }

  return transformAssessment(data);
}

export function useFamilyMeetings(userId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id || '';

  // Fetch meetings
  const {
    data: meetings = [],
    isLoading: meetingsLoading,
    error: meetingsError,
    refetch: refetchMeetings,
  } = useQuery({
    queryKey: familyMeetingsKeys.list(targetUserId),
    queryFn: () => fetchMeetings(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch assessments
  const {
    data: assessments = [],
    isLoading: assessmentsLoading,
    refetch: refetchAssessments,
  } = useQuery({
    queryKey: familyMeetingsKeys.assessments(targetUserId),
    queryFn: () => fetchAssessments(targetUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: ({ scheduledDate, notes }: { scheduledDate: Date; notes?: string }) =>
      createMeeting(targetUserId, scheduledDate, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMeetingsKeys.list(targetUserId) });
    },
  });

  // Complete meeting mutation
  const completeMeetingMutation = useMutation({
    mutationFn: ({ meetingId, attendees }: { meetingId: string; attendees?: string[] }) =>
      completeMeetingFn(meetingId, attendees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMeetingsKeys.list(targetUserId) });
    },
  });

  // Cancel meeting mutation
  const cancelMeetingMutation = useMutation({
    mutationFn: cancelMeetingFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMeetingsKeys.list(targetUserId) });
    },
  });

  // Add assessment mutation
  const addAssessmentMutation = useMutation({
    mutationFn: ({
      meetingId,
      studentId,
      studentName,
      ratings,
      notes,
    }: {
      meetingId: string;
      studentId: string;
      studentName: string;
      ratings: MeetingAssessment['ratings'];
      notes?: string;
    }) => createAssessment(meetingId, studentId, studentName, ratings, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMeetingsKeys.assessments(targetUserId) });
    },
  });

  // Get assessments for a specific meeting
  const getAssessmentsForMeeting = (meetingId: string) =>
    assessments.filter((a) => a.meetingId === meetingId);

  // Get the next scheduled meeting
  const nextMeeting = meetings
    .filter((m) => m.status === 'scheduled' && isAfter(parseISO(m.scheduledDate), new Date()))
    .sort((a, b) => parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime())[0];

  // Get completed meetings (most recent first)
  const completedMeetings = meetings
    .filter((m) => m.status === 'completed')
    .sort((a, b) =>
      parseISO(b.completedAt || b.scheduledDate).getTime() -
      parseISO(a.completedAt || a.scheduledDate).getTime()
    );

  // Get upcoming meetings
  const upcomingMeetings = meetings
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime());

  // Calculate meeting stats
  const stats = {
    totalMeetings: meetings.length,
    completedCount: meetings.filter((m) => m.status === 'completed').length,
    missedCount: meetings.filter((m) => m.status === 'missed').length,
    upcomingCount: upcomingMeetings.length,
    averageAssessmentScore:
      assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a.ratings.overall, 0) / assessments.length
        : null,
  };

  // Refetch all data
  const refetch = async () => {
    await Promise.all([refetchMeetings(), refetchAssessments()]);
  };

  return {
    // Data
    meetings,
    assessments,
    isLoading: meetingsLoading || assessmentsLoading,
    nextMeeting,
    upcomingMeetings,
    completedMeetings,
    stats,

    // Actions
    scheduleMeeting: (scheduledDate: Date, notes?: string) =>
      createMeetingMutation.mutateAsync({ scheduledDate, notes }),
    completeMeeting: (meetingId: string, attendees?: string[]) =>
      completeMeetingMutation.mutateAsync({ meetingId, attendees }),
    cancelMeeting: cancelMeetingMutation.mutateAsync,
    addAssessment: (
      meetingId: string,
      studentId: string,
      studentName: string,
      ratings: MeetingAssessment['ratings'],
      notes?: string
    ) => addAssessmentMutation.mutateAsync({ meetingId, studentId, studentName, ratings, notes }),

    // Helpers
    getAssessmentsForMeeting,
    refetch,

    // Mutation states
    isScheduling: createMeetingMutation.isPending,
    isCompleting: completeMeetingMutation.isPending,
    isCancelling: cancelMeetingMutation.isPending,
    isAddingAssessment: addAssessmentMutation.isPending,

    // Errors
    error: meetingsError,
  };
}
