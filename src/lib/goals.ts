import type { Goal, GoalStatus } from './types';

/** Overdue is derived from the clock, never stored — it changes on its own. */
export function statusOf(goal: Goal, now: Date = new Date()): GoalStatus {
  if (goal.completed) return 'completed';
  return new Date(goal.deadline).getTime() < now.getTime() ? 'overdue' : 'active';
}

export type GroupedGoals = {
  overdue: Goal[];
  active: Goal[];
  completed: Goal[];
};

/**
 * Splits goals into the three sections the home screen renders. Open goals sort
 * by nearest deadline first; completed ones by most recently ticked off.
 */
export function groupGoals(goals: Goal[], now: Date = new Date()): GroupedGoals {
  const byDeadline = (a: Goal, b: Goal) =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

  const byCompletedAt = (a: Goal, b: Goal) =>
    new Date(b.completedAt ?? b.updatedAt).getTime() -
    new Date(a.completedAt ?? a.updatedAt).getTime();

  return {
    overdue: goals.filter((goal) => statusOf(goal, now) === 'overdue').sort(byDeadline),
    active: goals.filter((goal) => statusOf(goal, now) === 'active').sort(byDeadline),
    completed: goals.filter((goal) => goal.completed).sort(byCompletedAt),
  };
}

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Kapalı' },
  { value: 0, label: 'Deadline anında' },
  { value: 1, label: '1 gün önce' },
  { value: 2, label: '2 gün önce' },
  { value: 3, label: '3 gün önce' },
  { value: 7, label: '1 hafta önce' },
];

export function describeReminder(remindDaysBefore: number | null): string {
  const option = REMINDER_OPTIONS.find((entry) => entry.value === remindDaysBefore);
  if (option) return option.label;
  return `${remindDaysBefore} gün önce`;
}
