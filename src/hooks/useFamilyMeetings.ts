import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns';

export interface FamilyMeeting {
  id: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'missed';
  notes?: string;
  attendees?: string[];
  createdAt: string;
  completedAt?: string;
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
  notes?: string;
  createdAt: string;
}

const MEETINGS_STORAGE_KEY = 'family_meetings';
const ASSESSMENTS_STORAGE_KEY = 'meeting_assessments';

export function useFamilyMeetings(userId: string | undefined) {
  const [meetings, setMeetings] = useState<FamilyMeeting[]>([]);
  const [assessments, setAssessments] = useState<MeetingAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const meetingsKey = `${MEETINGS_STORAGE_KEY}_${userId}`;
  const assessmentsKey = `${ASSESSMENTS_STORAGE_KEY}_${userId}`;

  // Load meetings and assessments from storage
  const loadData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const [storedMeetings, storedAssessments] = await Promise.all([
        AsyncStorage.getItem(meetingsKey),
        AsyncStorage.getItem(assessmentsKey),
      ]);

      if (storedMeetings) {
        const parsedMeetings: FamilyMeeting[] = JSON.parse(storedMeetings);
        // Auto-update status for past meetings
        const updatedMeetings = parsedMeetings.map((meeting) => {
          if (meeting.status === 'scheduled' && isBefore(parseISO(meeting.scheduledDate), new Date())) {
            return { ...meeting, status: 'missed' as const };
          }
          return meeting;
        });
        setMeetings(updatedMeetings);
      }

      if (storedAssessments) {
        setAssessments(JSON.parse(storedAssessments));
      }
    } catch (error) {
      console.error('Error loading family meetings data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingsKey, assessmentsKey, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save meetings to storage
  const saveMeetings = async (updatedMeetings: FamilyMeeting[]) => {
    if (!userId) return;

    try {
      await AsyncStorage.setItem(meetingsKey, JSON.stringify(updatedMeetings));
      setMeetings(updatedMeetings);
    } catch (error) {
      console.error('Error saving meetings:', error);
      throw error;
    }
  };

  // Save assessments to storage
  const saveAssessments = async (updatedAssessments: MeetingAssessment[]) => {
    if (!userId) return;

    try {
      await AsyncStorage.setItem(assessmentsKey, JSON.stringify(updatedAssessments));
      setAssessments(updatedAssessments);
    } catch (error) {
      console.error('Error saving assessments:', error);
      throw error;
    }
  };

  // Schedule a new meeting
  const scheduleMeeting = async (scheduledDate: Date, notes?: string) => {
    const newMeeting: FamilyMeeting = {
      id: Date.now().toString(),
      scheduledDate: scheduledDate.toISOString(),
      status: 'scheduled',
      notes,
      attendees: [],
      createdAt: new Date().toISOString(),
    };

    await saveMeetings([...meetings, newMeeting]);
    return newMeeting;
  };

  // Complete a meeting
  const completeMeeting = async (meetingId: string, attendees?: string[]) => {
    const updatedMeetings = meetings.map((meeting) =>
      meeting.id === meetingId
        ? {
            ...meeting,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            attendees,
          }
        : meeting
    );
    await saveMeetings(updatedMeetings);
  };

  // Cancel/Delete a meeting
  const cancelMeeting = async (meetingId: string) => {
    const updatedMeetings = meetings.filter((meeting) => meeting.id !== meetingId);
    await saveMeetings(updatedMeetings);
  };

  // Add a meeting assessment
  const addAssessment = async (
    meetingId: string,
    studentId: string,
    studentName: string,
    ratings: MeetingAssessment['ratings'],
    notes?: string
  ) => {
    const newAssessment: MeetingAssessment = {
      id: Date.now().toString(),
      meetingId,
      studentId,
      studentName,
      ratings,
      notes,
      createdAt: new Date().toISOString(),
    };

    await saveAssessments([...assessments, newAssessment]);
    return newAssessment;
  };

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
    .sort((a, b) => parseISO(b.completedAt || b.scheduledDate).getTime() - parseISO(a.completedAt || a.scheduledDate).getTime());

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

  return {
    meetings,
    assessments,
    isLoading,
    nextMeeting,
    upcomingMeetings,
    completedMeetings,
    stats,
    scheduleMeeting,
    completeMeeting,
    cancelMeeting,
    addAssessment,
    getAssessmentsForMeeting,
    refetch: loadData,
  };
}
