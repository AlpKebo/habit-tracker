/**
 * Core domain types. Everything here is serialised straight into AsyncStorage,
 * so keep it JSON-safe: dates are ISO strings, never Date instances.
 */

/** A calendar day in local time, formatted as `YYYY-MM-DD`. */
export type DayKey = string;

export type Goal = {
  id: string;
  title: string;
  /** Optional free text, empty string when unused. */
  description: string;
  /** Deadline as an ISO timestamp (date + time). */
  deadline: string;
  /** Remind this many days before the deadline. `null` means no reminder. */
  remindDaysBefore: number | null;
  /** Identifier returned by expo-notifications, kept so we can cancel it later. */
  notificationId: string | null;
  completed: boolean;
  /** ISO timestamp of the completion, `null` while the goal is active. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** What the user types into the create/edit form. */
export type GoalDraft = {
  title: string;
  description: string;
  deadline: string;
  remindDaysBefore: number | null;
};

/** Derived bucket a goal falls into, never persisted. */
export type GoalStatus = 'active' | 'overdue' | 'completed';

export type Streak = {
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate: DayKey | null;
};

/**
 * Everything we keep on the device. `completionDays` is the ledger the streak is
 * derived from — one entry per calendar day that had at least one completion.
 * Keeping it separately means deleting an old completed goal does not rewrite
 * history, while an undo can still remove a day that has no completions left.
 */
export type PersistedState = {
  version: number;
  goals: Goal[];
  completionDays: DayKey[];
  streak: Streak;
};
