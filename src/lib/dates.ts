import type { DayKey } from './types';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` for the local calendar day a date falls on. */
export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of the given day key. */
export function fromDayKey(key: DayKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Whole calendar days from `a` to `b`, ignoring the time of day. Positive when
 * `b` is later. Uses local midnights so DST shifts do not produce 0.96 of a day.
 */
export function daysBetweenKeys(a: DayKey, b: DayKey): number {
  return Math.round((fromDayKey(b).getTime() - fromDayKey(a).getTime()) / MS_PER_DAY);
}

/** The reminder moment for a deadline, or `null` when no reminder is wanted. */
export function reminderDateFor(deadlineIso: string, remindDaysBefore: number | null): Date | null {
  if (remindDaysBefore === null) return null;
  return addDays(new Date(deadlineIso), -remindDaysBefore);
}

/** The last `count` calendar days ending today, oldest first. */
export function lastDays(count: number, today: Date = new Date()): Date[] {
  const start = startOfDay(today);
  return Array.from({ length: count }, (_, i) => addDays(start, i - (count - 1)));
}

const WEEKDAY_LABELS = ['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

/** Two-letter Turkish weekday label, e.g. "Pt" for Monday. */
export function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

/**
 * Distance from now in plain words, e.g. "yaklaşık 2 dakika sonra".
 * Shown next to a picked date so an unchanged date is impossible to miss.
 */
export function describeRelative(target: Date, now: Date = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  const past = diffMs < 0;
  const minutes = Math.round(Math.abs(diffMs) / 60_000);
  const suffix = past ? 'önce' : 'sonra';

  if (minutes < 1) return past ? 'az önce' : 'birazdan';
  if (minutes < 60) return `yaklaşık ${minutes} dakika ${suffix}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `yaklaşık ${hours} saat ${suffix}`;

  const days = Math.round(hours / 24);
  return `yaklaşık ${days} gün ${suffix}`;
}

/**
 * Human-readable distance to a deadline, e.g. "3 gün kaldı" / "2 gün gecikti".
 * Counted in calendar days so a deadline later today reads as "Bugün".
 */
export function describeDeadline(deadlineIso: string, now: Date = new Date()): string {
  const diff = daysBetweenKeys(toDayKey(now), toDayKey(new Date(deadlineIso)));
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff === -1) return 'Dün';
  if (diff > 1) return `${diff} gün kaldı`;
  return `${Math.abs(diff)} gün gecikti`;
}
