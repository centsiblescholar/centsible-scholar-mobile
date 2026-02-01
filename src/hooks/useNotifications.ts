import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../contexts/AuthContext';
import {
  requestNotificationPermissions,
  getExpoPushToken,
  areNotificationsEnabled,
  setNotificationsEnabled,
  scheduleMeetingReminder,
  scheduleDailyQODReminder,
  sendLowBehaviorScoreAlert,
  sendPendingGradeNotification,
  sendGradeResultNotification,
  scheduleTermEndingReminder,
  cancelNotification,
  cancelNotificationsByType,
  cancelAllNotifications,
  getScheduledNotifications,
  clearBadge,
  NotificationType,
  ScheduledNotification,
} from '../services/notifications';

export interface UseNotificationsReturn {
  // State
  isEnabled: boolean;
  hasPermission: boolean;
  pushToken: string | null;
  scheduledNotifications: ScheduledNotification[];
  isLoading: boolean;

  // Actions
  requestPermission: () => Promise<boolean>;
  toggleNotifications: (enabled: boolean) => Promise<void>;

  // Scheduling
  scheduleMeetingReminder: (meetingId: string, meetingDate: Date, minutesBefore?: number) => Promise<string | null>;
  scheduleDailyQODReminder: (hour?: number, minute?: number) => Promise<string | null>;
  scheduleTermEndingReminder: (termEndDate: Date, daysBefore?: number) => Promise<string | null>;

  // Immediate notifications
  sendLowBehaviorAlert: (score: number, studentName?: string) => Promise<string | null>;
  sendPendingGradeNotification: (studentName: string, subject: string, grade: string) => Promise<string | null>;
  sendGradeResultNotification: (subject: string, grade: string, approved: boolean, notes?: string) => Promise<string | null>;

  // Management
  cancelNotification: (id: string) => Promise<void>;
  cancelByType: (type: NotificationType) => Promise<void>;
  cancelAll: () => Promise<void>;
  refreshScheduled: () => Promise<void>;
  clearBadge: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | undefined>(undefined);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined>(undefined);

  // Initialize notifications
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Check current permission status
        const { status } = await Notifications.getPermissionsAsync();
        setHasPermission(status === 'granted');

        // Check if user has enabled notifications
        const enabled = await areNotificationsEnabled();
        setIsEnabled(enabled);

        // Get push token if we have permission
        if (status === 'granted') {
          const token = await getExpoPushToken();
          setPushToken(token);
        }

        // Load scheduled notifications
        const scheduled = await getScheduledNotifications();
        setScheduledNotifications(scheduled);
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
        notificationListener.current.remove();
      }
      if (responseListener.current && typeof responseListener.current.remove === 'function') {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  // Handle notification taps
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const type = data?.type as NotificationType;

    // Navigate based on notification type
    // This can be expanded to use expo-router navigation
    switch (type) {
      case 'meeting_reminder':
        // Navigate to family meetings
        console.log('Navigate to family meetings');
        break;
      case 'pending_grade':
      case 'grade_approved':
      case 'grade_rejected':
        // Navigate to grades
        console.log('Navigate to grades');
        break;
      case 'low_behavior_score':
        // Navigate to behavior
        console.log('Navigate to behavior');
        break;
      case 'daily_qod':
        // Navigate to learn/QOD
        console.log('Navigate to learn');
        break;
      default:
        break;
    }
  };

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);

    if (granted) {
      const token = await getExpoPushToken();
      setPushToken(token);
      setIsEnabled(true);
      await setNotificationsEnabled(true);
    }

    return granted;
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(async (enabled: boolean): Promise<void> => {
    if (enabled && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setIsEnabled(enabled);
    await setNotificationsEnabled(enabled);

    if (!enabled) {
      setScheduledNotifications([]);
    }
  }, [hasPermission, requestPermission]);

  // Refresh scheduled notifications list
  const refreshScheduled = useCallback(async (): Promise<void> => {
    const scheduled = await getScheduledNotifications();
    setScheduledNotifications(scheduled);
  }, []);

  // Wrapper for scheduling meeting reminder
  const scheduleMeetingReminderWrapper = useCallback(
    async (meetingId: string, meetingDate: Date, minutesBefore?: number): Promise<string | null> => {
      if (!isEnabled) return null;
      const id = await scheduleMeetingReminder(meetingId, meetingDate, minutesBefore);
      await refreshScheduled();
      return id;
    },
    [isEnabled, refreshScheduled]
  );

  // Wrapper for scheduling daily QOD reminder
  const scheduleDailyQODReminderWrapper = useCallback(
    async (hour?: number, minute?: number): Promise<string | null> => {
      if (!isEnabled) return null;
      const id = await scheduleDailyQODReminder(hour, minute);
      await refreshScheduled();
      return id;
    },
    [isEnabled, refreshScheduled]
  );

  // Wrapper for scheduling term ending reminder
  const scheduleTermEndingReminderWrapper = useCallback(
    async (termEndDate: Date, daysBefore?: number): Promise<string | null> => {
      if (!isEnabled) return null;
      const id = await scheduleTermEndingReminder(termEndDate, daysBefore);
      await refreshScheduled();
      return id;
    },
    [isEnabled, refreshScheduled]
  );

  // Wrapper for low behavior alert
  const sendLowBehaviorAlertWrapper = useCallback(
    async (score: number, studentName?: string): Promise<string | null> => {
      if (!isEnabled) return null;
      return sendLowBehaviorScoreAlert(score, studentName);
    },
    [isEnabled]
  );

  // Wrapper for pending grade notification
  const sendPendingGradeNotificationWrapper = useCallback(
    async (studentName: string, subject: string, grade: string): Promise<string | null> => {
      if (!isEnabled) return null;
      return sendPendingGradeNotification(studentName, subject, grade);
    },
    [isEnabled]
  );

  // Wrapper for grade result notification
  const sendGradeResultNotificationWrapper = useCallback(
    async (subject: string, grade: string, approved: boolean, notes?: string): Promise<string | null> => {
      if (!isEnabled) return null;
      return sendGradeResultNotification(subject, grade, approved, notes);
    },
    [isEnabled]
  );

  // Cancel single notification
  const cancelNotificationWrapper = useCallback(
    async (id: string): Promise<void> => {
      await cancelNotification(id);
      await refreshScheduled();
    },
    [refreshScheduled]
  );

  // Cancel by type
  const cancelByTypeWrapper = useCallback(
    async (type: NotificationType): Promise<void> => {
      await cancelNotificationsByType(type);
      await refreshScheduled();
    },
    [refreshScheduled]
  );

  // Cancel all
  const cancelAllWrapper = useCallback(async (): Promise<void> => {
    await cancelAllNotifications();
    setScheduledNotifications([]);
  }, []);

  return {
    // State
    isEnabled,
    hasPermission,
    pushToken,
    scheduledNotifications,
    isLoading,

    // Actions
    requestPermission,
    toggleNotifications,

    // Scheduling
    scheduleMeetingReminder: scheduleMeetingReminderWrapper,
    scheduleDailyQODReminder: scheduleDailyQODReminderWrapper,
    scheduleTermEndingReminder: scheduleTermEndingReminderWrapper,

    // Immediate notifications
    sendLowBehaviorAlert: sendLowBehaviorAlertWrapper,
    sendPendingGradeNotification: sendPendingGradeNotificationWrapper,
    sendGradeResultNotification: sendGradeResultNotificationWrapper,

    // Management
    cancelNotification: cancelNotificationWrapper,
    cancelByType: cancelByTypeWrapper,
    cancelAll: cancelAllWrapper,
    refreshScheduled,
    clearBadge,
  };
}
