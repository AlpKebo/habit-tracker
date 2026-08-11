import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { lastDays, toDayKey, weekdayLabel } from '@/lib/dates';
import type { DayKey, Streak } from '@/lib/types';

type Props = {
  streak: Streak;
  completionDays: DayKey[];
  todayCompletions: number;
  completedToday: boolean;
};

const WEEK_LENGTH = 7;

export function StreakCard({ streak, completionDays, todayCompletions, completedToday }: Props) {
  const theme = useTheme();
  const alive = streak.currentStreak > 0;
  // The streak survives until a whole empty day has passed, so a live streak
  // with nothing done today is a warning rather than a loss.
  const atRisk = alive && !completedToday;

  const week = useMemo(() => {
    const done = new Set(completionDays);
    const todayKey = toDayKey(new Date());
    return lastDays(WEEK_LENGTH).map((date) => {
      const key = toDayKey(date);
      return { key, label: weekdayLabel(date), done: done.has(key), isToday: key === todayKey };
    });
  }, [completionDays]);

  const message = !alive
    ? 'Bugün bir goal tamamla ve seriyi başlat.'
    : atRisk
      ? 'Serin risk altında: bugün bitmeden bir goal tamamla.'
      : `Bugün ${todayCompletions} goal tamamladın. Seri devam ediyor.`;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headline}>
        <Text style={styles.flame}>{alive ? '🔥' : '🌱'}</Text>
        <View style={styles.headlineText}>
          <Text style={[styles.streakValue, { color: theme.text }]}>
            {streak.currentStreak}
            <Text style={[styles.streakUnit, { color: theme.textSecondary }]}> günlük seri</Text>
          </Text>
          <Text style={[styles.best, { color: theme.textTertiary }]}>
            En iyi seri: {streak.bestStreak} gün
          </Text>
        </View>
        <View style={[styles.todayPill, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.todayValue, { color: completedToday ? theme.success : theme.textTertiary }]}>
            {todayCompletions}
          </Text>
          <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>bugün</Text>
        </View>
      </View>

      <View style={styles.week}>
        {week.map((day) => (
          <View key={day.key} style={styles.day}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: day.done ? theme.accent : theme.surfaceMuted,
                  borderColor: day.isToday ? theme.accent : 'transparent',
                },
              ]}>
              {day.done ? <Text style={[styles.dotMark, { color: theme.onAccent }]}>✓</Text> : null}
            </View>
            <Text
              style={[
                styles.dayLabel,
                { color: day.isToday ? theme.accent : theme.textTertiary },
                day.isToday && styles.dayLabelToday,
              ]}>
              {day.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.message, { color: atRisk ? theme.warning : theme.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  best: {
    fontSize: 13,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  day: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  dayLabel: {
    fontSize: 11,
  },
  dayLabelToday: {
    fontWeight: '700',
  },
  dot: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dotMark: {
    fontSize: 14,
    fontWeight: '900',
  },
  flame: {
    fontSize: 34,
  },
  headline: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headlineText: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  streakUnit: {
    fontSize: 15,
    fontWeight: '600',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  todayLabel: {
    fontSize: 11,
  },
  todayPill: {
    alignItems: 'center',
    borderRadius: Radius.md,
    minWidth: 56,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  todayValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  week: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
