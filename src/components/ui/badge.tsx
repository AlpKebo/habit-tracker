import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GoalStatus } from '@/lib/types';

const LABELS: Record<GoalStatus, string> = {
  active: 'Aktif',
  overdue: 'Gecikti',
  completed: 'Tamamlandı',
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  const theme = useTheme();

  const palette: Record<GoalStatus, { background: string; text: string }> = {
    active: { background: theme.accentSoft, text: theme.accent },
    overdue: { background: theme.dangerSoft, text: theme.danger },
    completed: { background: theme.successSoft, text: theme.success },
  };
  const colors = palette[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
