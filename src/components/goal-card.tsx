import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeDeadline, formatDateTime } from '@/lib/dates';
import { describeReminder, statusOf } from '@/lib/goals';
import { tapLight, tapSuccess, tapWarning } from '@/lib/haptics';
import type { Goal } from '@/lib/types';

type Props = {
  goal: Goal;
  onToggle: () => void;
  onDelete: () => void;
  onPress: () => void;
};

const ACTION_WIDTH = 88;

/** Slides in from the edge as the row is dragged, tracking the drag distance. */
function SwipeAction({
  drag,
  side,
  background,
  icon,
  label,
  onPress,
}: {
  drag: SharedValue<number>;
  side: 'left' | 'right';
  background: string;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: side === 'right' ? drag.value + ACTION_WIDTH : drag.value - ACTION_WIDTH },
    ],
  }));

  return (
    <Animated.View style={[styles.action, { backgroundColor: background }, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.actionPress}>
        <Text style={styles.actionIcon}>{icon}</Text>
        <Text style={styles.actionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function GoalCard({ goal, onToggle, onDelete, onPress }: Props) {
  const theme = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);
  const status = statusOf(goal);
  const deadline = new Date(goal.deadline);

  const accent =
    status === 'overdue' ? theme.danger : status === 'completed' ? theme.success : theme.accent;
  const deadlineColor = status === 'overdue' ? theme.danger : theme.textSecondary;

  const handleToggle = () => {
    if (goal.completed) tapLight();
    else tapSuccess();
    onToggle();
  };

  const handleSwipeToggle = () => {
    swipeable.current?.close();
    handleToggle();
  };

  const handleSwipeDelete = () => {
    swipeable.current?.close();
    tapWarning();
    onDelete();
  };

  return (
    <ReanimatedSwipeable
      containerStyle={styles.swipeContainer}
      friction={2}
      leftThreshold={ACTION_WIDTH / 2}
      overshootFriction={8}
      ref={swipeable}
      renderLeftActions={(_progress, drag) => (
        <SwipeAction
          background={goal.completed ? theme.textTertiary : theme.success}
          drag={drag}
          icon={goal.completed ? '↺' : '✓'}
          label={goal.completed ? 'Geri al' : 'Tamamla'}
          onPress={handleSwipeToggle}
          side="left"
        />
      )}
      renderRightActions={(_progress, drag) => (
        <SwipeAction
          background={theme.danger}
          drag={drag}
          icon="🗑"
          label="Sil"
          onPress={handleSwipeDelete}
          side="right"
        />
      )}
      rightThreshold={ACTION_WIDTH / 2}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${goal.title}, ${formatDateTime(deadline)}`}
        accessibilityHint="Düzenlemek için dokun, tamamlamak veya silmek için kaydır"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        {/* Status reads at a glance from the stripe, before any text is parsed. */}
        <View style={[styles.stripe, { backgroundColor: goal.completed ? theme.border : accent }]} />

        <View style={styles.inner}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: goal.completed }}
            accessibilityLabel={
              goal.completed ? 'Tamamlamayı geri al' : 'Tamamlandı olarak işaretle'
            }
            hitSlop={12}
            onPress={handleToggle}
            style={({ pressed }) => [
              styles.checkbox,
              {
                backgroundColor: goal.completed ? theme.success : 'transparent',
                borderColor: goal.completed ? theme.success : theme.border,
                transform: [{ scale: pressed ? 0.88 : 1 }],
              },
            ]}>
            {goal.completed ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>

          <View style={styles.body}>
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

            {goal.description ? (
              <Text numberOfLines={2} style={[styles.description, { color: theme.textSecondary }]}>
                {goal.description}
              </Text>
            ) : null}

            <View style={styles.meta}>
              <Text style={[styles.metaText, { color: deadlineColor }]}>
                {formatDateTime(deadline)}
              </Text>

              {!goal.completed ? (
                <View style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
                  <Text style={[styles.chipText, { color: deadlineColor }]}>
                    {describeDeadline(goal.deadline)}
                  </Text>
                </View>
              ) : null}

              {goal.remindDaysBefore !== null && !goal.completed ? (
                <View style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
                  <Text
                    style={[
                      styles.chipText,
                      { color: goal.notificationId ? theme.accent : theme.textTertiary },
                    ]}>
                    {goal.notificationId ? '🔔' : '🔕'} {describeReminder(goal.remindDaysBefore)}
                    {goal.notificationId ? '' : ' · planlanmadı'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
    width: ACTION_WIDTH,
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionPress: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
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
  chip: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  stripe: {
    width: 4,
  },
  swipeContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
