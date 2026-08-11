import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeDeadline, formatDateTime } from '@/lib/dates';
import { describeReminder, statusOf } from '@/lib/goals';
import type { Goal } from '@/lib/types';

type Props = {
  goal: Goal;
  onToggle: () => void;
  onPress: () => void;
};

export function GoalCard({ goal, onToggle, onPress }: Props) {
  const theme = useTheme();
  const status = statusOf(goal);
  const deadline = new Date(goal.deadline);

  const deadlineColor =
    status === 'overdue' ? theme.danger : status === 'completed' ? theme.textTertiary : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}, ${formatDateTime(deadline)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: goal.completed }}
        accessibilityLabel={goal.completed ? 'Tamamlamayı geri al' : 'Tamamlandı olarak işaretle'}
        hitSlop={10}
        onPress={onToggle}
        style={[
          styles.checkbox,
          {
            backgroundColor: goal.completed ? theme.success : 'transparent',
            borderColor: goal.completed ? theme.success : theme.border,
          },
        ]}>
        {goal.completed ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: goal.completed ? theme.textTertiary : theme.text,
                textDecorationLine: goal.completed ? 'line-through' : 'none',
              },
            ]}>
            {goal.title}
          </Text>
          <StatusBadge status={status} />
        </View>

        {goal.description ? (
          <Text numberOfLines={2} style={[styles.description, { color: theme.textSecondary }]}>
            {goal.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: deadlineColor }]}>
            {formatDateTime(deadline)}
          </Text>
          {!goal.completed ? (
            <Text style={[styles.meta, { color: deadlineColor }]}>
              {' · '}
              {describeDeadline(goal.deadline)}
            </Text>
          ) : null}
        </View>

        {goal.remindDaysBefore !== null && !goal.completed ? (
          <Text style={[styles.reminder, { color: theme.textTertiary }]}>
            {goal.notificationId ? '🔔' : '🔕'} {describeReminder(goal.remindDaysBefore)}
            {goal.notificationId ? '' : ' · planlanmadı'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  check: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    marginTop: 2,
    width: 26,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reminder: {
    fontSize: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
