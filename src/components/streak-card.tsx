import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Streak } from '@/lib/types';

type Props = {
  streak: Streak;
  todayCompletions: number;
  completedToday: boolean;
};

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function StreakCard({ streak, todayCompletions, completedToday }: Props) {
  const theme = useTheme();
  const alive = streak.currentStreak > 0;
  // The streak survives until a whole empty day has passed, so a live streak
  // with nothing done today is a warning rather than a loss.
  const atRisk = alive && !completedToday;

  const message = !alive
    ? 'Bugün bir goal tamamla ve seriyi başlat.'
    : atRisk
      ? 'Serin risk altında: bugün bitmeden bir goal tamamla.'
      : `Bugün ${todayCompletions} goal tamamladın. Seri devam ediyor.`;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.row}>
        <Stat
          value={`${streak.currentStreak}🔥`}
          label="Güncel seri"
          color={alive ? theme.accent : theme.textTertiary}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Stat value={`${streak.bestStreak}`} label="En iyi seri" color={theme.text} />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Stat value={`${todayCompletions}`} label="Bugün" color={theme.text} />
      </View>
      <Text style={[styles.message, { color: atRisk ? theme.warning : theme.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  divider: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
});
