import { daysBetweenKeys, toDayKey } from './dates';
import type { DayKey, Goal, Streak } from './types';

export const EMPTY_STREAK: Streak = {
  currentStreak: 0,
  bestStreak: 0,
  lastCompletionDate: null,
};

/** Sorted ascending, duplicates removed. */
export function normaliseDays(days: DayKey[]): DayKey[] {
  return Array.from(new Set(days)).sort();
}

/**
 * Derives the streak from the ledger of days that had at least one completion.
 *
 * A day counts once no matter how many goals were completed on it. The current
 * streak survives while the last completion is today or yesterday — today is
 * still in progress, so it is only a broken streak once a whole day has passed
 * with nothing completed.
 */
export function computeStreak(days: DayKey[], today: DayKey = toDayKey(new Date())): Streak {
  const sorted = normaliseDays(days);
  if (sorted.length === 0) return EMPTY_STREAK;

  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetweenKeys(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  const last = sorted[sorted.length - 1];
  const gap = daysBetweenKeys(last, today);
  // `run` is the length of the run ending on `last`, which is what we want.
  const current = gap === 0 || gap === 1 ? run : 0;

  return { currentStreak: current, bestStreak: best, lastCompletionDate: last };
}

/** Adds a day to the ledger. Re-adding the same day is a no-op. */
export function addCompletionDay(days: DayKey[], day: DayKey): DayKey[] {
  return days.includes(day) ? days : normaliseDays([...days, day]);
}

/**
 * Removes a day from the ledger, but only when no remaining goal was completed
 * on it — undoing one of two completions on the same day must not break it.
 */
export function removeCompletionDayIfUnused(
  days: DayKey[],
  day: DayKey,
  goals: Goal[],
): DayKey[] {
  const stillUsed = goals.some(
    (goal) => goal.completed && goal.completedAt !== null && toDayKey(new Date(goal.completedAt)) === day,
  );
  return stillUsed ? days : days.filter((entry) => entry !== day);
}

/** Number of goals completed on a given calendar day. */
export function completionsOn(goals: Goal[], day: DayKey): number {
  return goals.filter(
    (goal) => goal.completed && goal.completedAt !== null && toDayKey(new Date(goal.completedAt)) === day,
  ).length;
}
