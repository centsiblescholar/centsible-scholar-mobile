import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: 'push_notification_token',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
};

// Notification types
export type NotificationType =
  | 'meeting_reminder'
  | 'low_behavior_score'
  | 'pending_grade'
  | 'grade_approved'
  | 'grade_rejected'
  | 'term_ending'
  | 'daily_qod';

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: string;
  data?: Record<string, any>;
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }

  // For Android, set up the notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });

    // Meeting reminders channel
    await Notifications.setNotificationChannelAsync('meetings', {
      name: 'Family Meetings',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Reminders for upcoming family meetings',
    });

    // Grade notifications channel
    await Notifications.setNotificationChannelAsync('grades', {
      name: 'Grade Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Notifications about grade submissions and approvals',
    });

    // Behavior alerts channel
    await Notifications.setNotificationChannelAsync('behavior', {
      name: 'Behavior Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Alerts for low behavior scores',
    });
  }

  return true;
}

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Check if we have a cached token
    const cachedToken = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    if (cachedToken) {
      return cachedToken;
    }

    if (!Device.isDevice) {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('No project ID found for push notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Cache the token
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token.data);

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  type: NotificationType,
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const channelId = getChannelForType(type);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type, ...data },
        sound: true,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger,
    });

    // Save to scheduled notifications list
    await saveScheduledNotification({
      id: notificationId,
      type,
      title,
      body,
      scheduledFor: new Date().toISOString(),
      data,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a meeting reminder notification
 */
export async function scheduleMeetingReminder(
  meetingId: string,
  meetingDate: Date,
  reminderMinutesBefore: number = 60
): Promise<string | null> {
  const reminderDate = new Date(meetingDate.getTime() - reminderMinutesBefore * 60 * 1000);

  // Don't schedule if the reminder time is in the past
  if (reminderDate <= new Date()) {
    return null;
  }

  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return scheduleNotification(
    'meeting_reminder',
    'Family Meeting Reminder',
    `You have a family meeting scheduled for ${formattedTime}`,
    { type: SchedulableTriggerInputTypes.DATE, date: reminderDate },
    { meetingId }
  );
}

/**
 * Schedule a daily QOD reminder
 */
export async function scheduleDailyQODReminder(
  hour: number = 16, // 4 PM default
  minute: number = 0
): Promise<string | null> {
  // Cancel any existing QOD reminders first
  await cancelNotificationsByType('daily_qod');

  return scheduleNotification(
    'daily_qod',
    "Don't Forget Your Question!",
    'Complete your Question of the Day to keep your streak going!',
    {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    {}
  );
}

/**
 * Send an immediate notification for low behavior score
 */
export async function sendLowBehaviorScoreAlert(
  score: number,
  studentName?: string
): Promise<string | null> {
  const title = studentName
    ? `${studentName}'s Behavior Score Alert`
    : 'Behavior Score Alert';

  return scheduleNotification(
    'low_behavior_score',
    title,
    `Today's behavior score (${score.toFixed(1)}) is below the bonus threshold. Keep working on those positive habits!`,
    null, // Immediate notification
    { score }
  );
}

/**
 * Send notification for pending grade (to parents)
 */
export async function sendPendingGradeNotification(
  studentName: string,
  subject: string,
  grade: string
): Promise<string | null> {
  return scheduleNotification(
    'pending_grade',
    'New Grade to Review',
    `${studentName} submitted a grade for ${subject}: ${grade}`,
    null,
    { studentName, subject, grade }
  );
}

/**
 * Send notification when grade is approved/rejected
 */
export async function sendGradeResultNotification(
  subject: string,
  grade: string,
  approved: boolean,
  notes?: string
): Promise<string | null> {
  const type = approved ? 'grade_approved' : 'grade_rejected';
  const title = approved ? 'Grade Approved!' : 'Grade Needs Review';
  const body = approved
    ? `Your ${subject} grade (${grade}) has been approved!`
    : `Your ${subject} grade needs revision. ${notes || ''}`;

  return scheduleNotification(type, title, body, null, { subject, grade, approved });
}

/**
 * Schedule term ending reminder
 */
export async function scheduleTermEndingReminder(
  termEndDate: Date,
  daysBeforeEnd: number = 7
): Promise<string | null> {
  const reminderDate = new Date(termEndDate.getTime() - daysBeforeEnd * 24 * 60 * 60 * 1000);

  if (reminderDate <= new Date()) {
    return null;
  }

  return scheduleNotification(
    'term_ending',
    'Term Ending Soon',
    `Your current term ends in ${daysBeforeEnd} days. Make sure all grades are submitted!`,
    { type: SchedulableTriggerInputTypes.DATE, date: reminderDate },
    { termEndDate: termEndDate.toISOString() }
  );
}

/**
 * Cancel a specific notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await removeScheduledNotification(notificationId);
}

/**
 * Cancel all notifications of a specific type
 */
export async function cancelNotificationsByType(type: NotificationType): Promise<void> {
  const scheduled = await getScheduledNotifications();
  const toCancel = scheduled.filter((n) => n.type === type);

  for (const notification of toCancel) {
    await cancelNotification(notification.id);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  if (stored !== null) {
    return stored === 'true';
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Enable/disable notifications
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());

  if (!enabled) {
    await cancelAllNotifications();
  }
}

/**
 * Get the badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear the badge
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

// Helper functions

function getChannelForType(type: NotificationType): string {
  switch (type) {
    case 'meeting_reminder':
      return 'meetings';
    case 'pending_grade':
    case 'grade_approved':
    case 'grade_rejected':
      return 'grades';
    case 'low_behavior_score':
      return 'behavior';
    default:
      return 'default';
  }
}

async function saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
  const scheduled = await getScheduledNotifications();
  scheduled.push(notification);
  await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(scheduled));
}

async function removeScheduledNotification(notificationId: string): Promise<void> {
  const scheduled = await getScheduledNotifications();
  const filtered = scheduled.filter((n) => n.id !== notificationId);
  await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(filtered));
}
