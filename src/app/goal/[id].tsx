import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { GoalForm } from '@/components/goal-form';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGoals } from '@/lib/goals-store';
import { announceScheduleOutcome } from '@/lib/schedule-feedback';

export default function EditGoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, updateGoal, deleteGoal } = useGoals();

  const goal = goals.find((entry) => entry.id === id);

  if (!goal) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Text style={[styles.missingText, { color: theme.textSecondary }]}>
          Bu goal artık mevcut değil.
        </Text>
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Goal silinsin mi?', `“${goal.title}” kalıcı olarak silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void deleteGoal(goal.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {goal.completed ? (
        <Text style={[styles.notice, { color: theme.textSecondary, borderColor: theme.border }]}>
          Bu goal tamamlandı. Hatırlatma listede geri alınca yeniden planlanır.
        </Text>
      ) : null}
      <GoalForm
        initial={{
          title: goal.title,
          description: goal.description,
          deadline: goal.deadline,
          remindDaysBefore: goal.remindDaysBefore,
        }}
        onDelete={confirmDelete}
        onSubmit={async (draft) => {
          const outcome = await updateGoal(goal.id, draft);
          router.back();
          announceScheduleOutcome(outcome);
        }}
        submitLabel="Değişiklikleri kaydet"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  missing: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  missingText: {
    fontSize: 15,
    textAlign: 'center',
  },
  notice: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  screen: {
    flex: 1,
  },
});
