import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { formatDateTime, reminderDateFor } from './dates';
import type { Goal, GoalDraft } from './types';

const ANDROID_CHANNEL_ID = 'goal-reminders';

/** Foreground behaviour: a reminder that arrives while the app is open still shows. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export type ScheduleOutcome =
  /** Reminder is on the calendar. */
  | { status: 'scheduled'; notificationId: string; fireDate: Date }
  /** The user did not ask for a reminder. */
  | { status: 'no-reminder' }
  /** Deadline minus X days is already behind us — nothing to schedule. */
  | { status: 'past'; fireDate: Date }
  /** Notifications are switched off, so the goal is saved without a reminder. */
  | { status: 'denied' };

/**
 * Android needs an explicit channel before anything will display, and it has to
 * exist before the first notification is posted.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Goal hatırlatmaları',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4C6FFF',
  });
}

function toPermissionState(status: Notifications.PermissionStatus): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return toPermissionState(status);
}

/**
 * Asks once. If the OS has already recorded a denial it will not prompt again,
 * so the caller should offer a route into Settings instead.
 */
export async function requestPermission(): Promise<PermissionState> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return 'granted';
  if (!existing.canAskAgain) return 'denied';

  const { status } = await Notifications.requestPermissionsAsync();
  return toPermissionState(status);
}

export function openSystemSettings(): void {
  Linking.openSettings().catch(() => {
    // Nothing else we can do; the banner stays visible so the user can retry.
  });
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired or already cancelled — either way there is nothing left to do.
  }
}

/**
 * Schedules the reminder for a goal, asking for permission the first time one
 * is needed. Never throws: a goal must still save when the reminder cannot.
 */
export async function scheduleReminder(
  draft: Pick<GoalDraft, 'title' | 'deadline' | 'remindDaysBefore'>,
): Promise<ScheduleOutcome> {
  const fireDate = reminderDateFor(draft.deadline, draft.remindDaysBefore);
  if (!fireDate) return { status: 'no-reminder' };
  if (fireDate.getTime() <= Date.now()) return { status: 'past', fireDate };

  const permission = await requestPermission();
  if (permission !== 'granted') return { status: 'denied' };

  await ensureAndroidChannel();

  const deadlineText = formatDateTime(new Date(draft.deadline));
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Deadline yaklaşıyor',
      body: `“${draft.title}” için son tarih: ${deadlineText}`,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });

  return { status: 'scheduled', notificationId, fireDate };
}

/** Cancels whatever a goal had scheduled, then schedules the new reminder. */
export async function rescheduleReminder(
  previous: Goal | null,
  draft: Pick<GoalDraft, 'title' | 'deadline' | 'remindDaysBefore'>,
): Promise<ScheduleOutcome> {
  await cancelReminder(previous?.notificationId ?? null);
  return scheduleReminder(draft);
}

/**
 * Drops any scheduled reminder that no longer has a live goal behind it.
 * Guards against IDs orphaned by a crash between scheduling and persisting.
 */
export async function pruneOrphanedReminders(goals: Goal[]): Promise<void> {
  const known = new Set(
    goals.map((goal) => goal.notificationId).filter((id): id is string => id !== null),
  );
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => !known.has(notification.identifier))
      .map((notification) => cancelReminder(notification.identifier)),
  );
}
