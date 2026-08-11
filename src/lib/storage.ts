import AsyncStorage from '@react-native-async-storage/async-storage';

import { computeStreak, normaliseDays } from './streak';
import type { Goal, PersistedState } from './types';

const STORAGE_KEY = 'habit-tracker/state/v1';

export const EMPTY_STATE: PersistedState = {
  version: 1,
  goals: [],
  completionDays: [],
  streak: { currentStreak: 0, bestStreak: 0, lastCompletionDate: null },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Rebuilds a goal from untyped storage data, dropping anything unusable.
 * A single corrupt entry should not take the whole list down with it.
 */
function parseGoal(raw: unknown): Goal | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.title !== 'string') return null;
  if (typeof raw.deadline !== 'string' || Number.isNaN(Date.parse(raw.deadline))) return null;

  const now = new Date().toISOString();
  return {
    id: raw.id,
    title: raw.title,
    description: typeof raw.description === 'string' ? raw.description : '',
    deadline: raw.deadline,
    remindDaysBefore: typeof raw.remindDaysBefore === 'number' ? raw.remindDaysBefore : null,
    notificationId: typeof raw.notificationId === 'string' ? raw.notificationId : null,
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

export async function loadState(): Promise<PersistedState> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return EMPTY_STATE;

  let raw: unknown;
  try {
    raw = JSON.parse(stored);
  } catch {
    return EMPTY_STATE;
  }
  if (!isRecord(raw)) return EMPTY_STATE;

  const goals = Array.isArray(raw.goals)
    ? raw.goals.map(parseGoal).filter((goal): goal is Goal => goal !== null)
    : [];
  const completionDays = normaliseDays(
    Array.isArray(raw.completionDays)
      ? raw.completionDays.filter((day): day is string => typeof day === 'string')
      : [],
  );

  // The streak is always recomputed on load: a stored value goes stale the
  // moment the app sits unopened over midnight.
  return { version: 1, goals, completionDays, streak: computeStreak(completionDays) };
}

export async function saveState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
